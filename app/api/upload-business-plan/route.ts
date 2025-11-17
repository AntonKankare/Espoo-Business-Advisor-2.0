import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import pdfParse from 'pdf-parse';
import { generateBusinessPlanInsight, assessDocumentationReadiness, type ChatMessage } from '@/lib/openai';
import mammoth from 'mammoth'; // for .docx
import JSZip from 'jszip'; // for .pptx
import ExcelJS from 'exceljs'; // for .xls/.xlsx

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get('sessionId');
    // Support both single file (legacy: "file") and multiple files ("files")
    const single = formData.get('file');
    const multiple = formData.getAll('files');
    const files: Blob[] = [];
    if (single instanceof Blob) files.push(single);
    for (const x of multiple) {
      if (x instanceof Blob) files.push(x);
    }

    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }
    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    // Extract text from all files
    async function extractFromFile(blob: Blob): Promise<{ name: string; text: string }> {
      const name = (blob as any).name || 'document';
      const ext = name.toLowerCase().split('.').pop() || '';
      // Read once as ArrayBuffer so we can use both Node Buffer (for some libs)
      // and plain ArrayBuffer (for ExcelJS typings) without type conflicts.
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
        if (ext === 'pdf') {
          const parsed = await (pdfParse as any)(buffer);
          return { name, text: String(parsed?.text || '') };
        }
        if (ext === 'docx') {
          const res = await mammoth.extractRawText({ buffer });
          return { name, text: String(res?.value || '') };
        }
        if (ext === 'xlsx' || ext === 'xls') {
          const workbook = new ExcelJS.Workbook();
          // ExcelJS typings accept ArrayBuffer; using arrayBuffer avoids Buffer generic type mismatch
          await workbook.xlsx.load(arrayBuffer);
          let out = '';
          workbook.eachSheet((worksheet, sheetId) => {
            out += `\n[Sheet: ${worksheet.name}]\n`;
            worksheet.eachRow((row, rowNumber) => {
              const values = row.values as any[];
              // Skip the first element (it's undefined in exceljs)
              const cleanValues = values.slice(1).map(v => v ?? '').join(',');
              if (cleanValues.trim()) {
                out += cleanValues + '\n';
              }
            });
          });
          return { name, text: out.trim() };
        }
        if (ext === 'pptx') {
          const zip = await JSZip.loadAsync(buffer);
          const slideFiles = Object.keys(zip.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k));
          let out = '';
          for (const sf of slideFiles) {
            const xml = await zip.file(sf)!.async('string');
            const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            out += `\n[Slide: ${sf.split('/').pop()}]\n${text}`;
          }
          return { name, text: out.trim() };
        }
        // Basic fallback for unknown types
        return { name, text: '' };
      } catch {
        return { name, text: '' };
      }
    }
    const extracted = await Promise.all(files.map(extractFromFile));
    const anyText = extracted.some((e) => e.text && e.text.trim().length > 0);
    if (!anyText) {
      return NextResponse.json({ error: 'Could not extract text from uploaded files.' }, { status: 400 });
    }
    const combinedText =
      extracted
        .map((e) => `--- FILE: ${e.name} ---\n${e.text}`)
        .join('\n\n');

    const session = await prisma.businessIdeaSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Store extracted text (reuse businessPlanText field)
    await prisma.businessIdeaSession.update({
      where: { id: sessionId },
      // TS typing for Prisma Client seems out-of-sync with the schema; cast to any to avoid
      // a false-positive type error while still updating the correct column at runtime.
      data: { businessPlanText: combinedText } as any,
    });

    // Generate assistant insight for the first file (legacy behavior) to show a quick recap
    const userLanguage = session.userLanguage || session.uiLanguage || 'en';
    const uiLanguage = session.uiLanguage || 'en';
    const insight = await generateBusinessPlanInsight({
      pdfText: extracted[0]?.text || combinedText.slice(0, 8000),
      userLanguage,
      uiLanguage,
    });

    // Assess if documentation is enough to skip most of the flow
    const assessment = await assessDocumentationReadiness({
      combinedText,
      userLanguage,
      uiLanguage,
    });

    // Append assistant message to transcript
    let existingTranscript: ChatMessage[] = [];
    try {
      if (session.rawTranscript) {
        existingTranscript = JSON.parse(session.rawTranscript) as ChatMessage[];
        if (!Array.isArray(existingTranscript)) existingTranscript = [];
      }
    } catch {
      existingTranscript = [];
    }
    const combinedAssistantText =
      assessment.hasEnoughInfo
        ? `${insight}\n\n${assessment.assistantSummary}\n\n${
            userLanguage.startsWith('fi')
              ? 'Onko sinulla huolia, kysymyksiä tai aiheita, jotka haluat nostaa esiin neuvojalle?'
              : 'Do you have any worries, questions, or specific topics you want to highlight to the business advisor?'
          }`
        : `${insight}\n\n${
            userLanguage.startsWith('fi')
              ? 'Luimme dokumenttisi. Ne ovat hyvä alku, mutta täydennetään vielä muutama asia yhdessä.'
              : "I've read your documents. They’re a good start, but we still need to clarify a few things together."
          }`;
    const assistantMessage: ChatMessage = { role: 'assistant', content: combinedAssistantText.trim() };
    const updatedTranscript = [...existingTranscript, assistantMessage];
    await prisma.businessIdeaSession.update({
      where: { id: sessionId },
      data: { rawTranscript: JSON.stringify(updatedTranscript) },
    });

    return NextResponse.json({
      ok: true,
      assistantMessage,
      hasEnoughInfo: assessment.hasEnoughInfo,
      missingTopics: assessment.missingTopics,
    });
  } catch (err: any) {
    console.error('POST /api/upload-business-plan error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


