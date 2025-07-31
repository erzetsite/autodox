import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIResponse {
  toc: { title: string; page: number }[];
  figures: { title: string; page: number }[];
  tables: { title: string; page: number }[];
  appendices: { title: string; page: number }[];
  references: { authors: string; year: number; title: string; source: string }[];
  romanPages: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file || !file.name.endsWith('.docx')) {
        return new Response('Invalid file', { status: 400 });
      }

      // Parse docx to text
      const buffer = await file.arrayBuffer();
      const { value: text } = await mammoth.extractRawText({ buffer });

      // Call Gemini API
      const genAI = new GoogleGenerativeAI(env.GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Extract structure from this document text and return JSON with:
      {
        "toc": [{"title": "...", "page": 1}],
        "figures": [{"title": "...", "page": 1}],
        "tables": [{"title": "...", "page": 1}],
        "appendices": [{"title": "...", "page": 1}],
        "references": [{"authors": "...", "year": 2024, "title": "...", "source": "..."}],
        "romanPages": 3
      }
      Document: ${text}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse: AIResponse = JSON.parse(response.text());

      // Generate new DOCX
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                numbering: {
                  start: 1,
                  formatType: 'roman',
                },
              },
            },
            children: [
              new Paragraph({
                text: "AutoDOCx v2 - Formatted Document",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              ...Array(aiResponse.romanPages - 1).fill(new Paragraph({ text: "" })),
            ],
          },
          {
            properties: {
              page: {
                numbering: {
                  start: 1,
                  formatType: 'decimal',
                },
              },
            },
            children: [
              new Paragraph({
                text: "Daftar Isi",
                heading: HeadingLevel.HEADING_1,
              }),
              ...aiResponse.toc.map(item => 
                new Paragraph({
                  children: [
                    new TextRun(item.title),
                    new TextRun({ text: `.... ${item.page}`, bold: true }),
                  ],
                })
              ),
              new Paragraph({}),
              new Paragraph({
                text: "Daftar Gambar",
                heading: HeadingLevel.HEADING_1,
              }),
              ...aiResponse.figures.map(item => 
                new Paragraph({
                  children: [
                    new TextRun(item.title),
                    new TextRun({ text: `.... ${item.page}`, bold: true }),
                  ],
                })
              ),
              new Paragraph({}),
              new Paragraph({
                text: "Daftar Tabel",
                heading: HeadingLevel.HEADING_1,
              }),
              ...aiResponse.tables.map(item => 
                new Paragraph({
                  children: [
                    new TextRun(item.title),
                    new TextRun({ text: `.... ${item.page}`, bold: true }),
                  ],
                })
              ),
              new Paragraph({}),
              new Paragraph({
                text: "Daftar Lampiran",
                heading: HeadingLevel.HEADING_1,
              }),
              ...aiResponse.appendices.map(item => 
                new Paragraph({
                  children: [
                    new TextRun(item.title),
                    new TextRun({ text: `.... ${item.page}`, bold: true }),
                  ],
                })
              ),
              new Paragraph({}),
              new Paragraph({
                text: "Daftar Pustaka",
                heading: HeadingLevel.HEADING_1,
              }),
              ...aiResponse.references
                .sort((a, b) => {
                  if (a.authors !== b.authors) return a.authors.localeCompare(b.authors);
                  return a.year - b.year;
                })
                .map(ref => 
                  new Paragraph({
                    text: `${ref.authors} (${ref.year}). ${ref.title}. ${ref.source}.`,
                    style: 'reference',
                  })
                ),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      
      return new Response(blob, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="formatted_autodox.docx"',
        },
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
};
