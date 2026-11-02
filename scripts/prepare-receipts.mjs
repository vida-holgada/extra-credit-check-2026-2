// Produces ignored, local-only runtime values. Never place source records in public/ or app/.
import fs from 'node:fs';
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) throw new Error('Usage: node scripts/prepare-receipts.mjs source.json .dev.vars');
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const data = {
  asOf: input.asOf,
  definitions: {
    science: { name: '과학기술과문명', titles: ['전시 감상문', '중간과제 계획서', null, null, null] },
    ai: { name: '인공지능과현대사회', titles: [null, '특강 감상문', null, null, null] },
  },
  students: {},
};
for (const r of input.roster) {
  const course = r.course === '과학기술과문명' ? 'science' : 'ai';
  const enrollment = { course, section: r.section, items: {} };
  const submissions = input.submissions.filter(s => s.studentId === r.studentId && s.course === r.course && s.section === r.section);
  // Keep known receipt times first; file-only confirmations may have no timestamp.
  for (const s of submissions.sort((a, b) => (a.receivedAt || '\uffff').localeCompare(b.receivedAt || '\uffff'))) {
    const number = course === 'science' ? s.assignment.startsWith('EC1 ') ? 1 : s.assignment === 'EC2 중간과제 계획서' ? 2 : null : s.assignment === '특강 감상문' ? 2 : null;
    if (!number) continue;
    // First received submission establishes the submission time; later resubmissions do not erase it.
    if (enrollment.items[number]) continue;
    let note = null;
    if (s.read === '첨부 만료') note = '제출 내역이 있으며, 첨부파일은 다시 확인이 필요합니다.';
    if (s.read === '계획서 미확인') note = '첨부파일이 수업 안내자료여서 계획서 확인이 필요합니다.';
    if ((s.note || '').includes('적용 항목 확인 필요')) note = '제출 내역이 있으며, 과제 적용 항목을 확인하고 있습니다.';
    if (!s.receivedAt) note = '제출 파일 확인 · 수신 시각 미확인';
    enrollment.items[number] = ['submitted', s.receivedAt || null, note];
  }
  (data.students[r.studentId] ||= []).push(enrollment);
}
const serialized = JSON.stringify(data);
const chunks = [];
let chunk = '';
for (const character of serialized) {
  if (Buffer.byteLength(chunk + character, 'utf8') > 3500) { chunks.push(chunk); chunk = ''; }
  chunk += character;
}
if (chunk) chunks.push(chunk);
if (chunks.length > 8) throw new Error('Runtime dataset exceeds configured size');
if (serialized.includes("'")) throw new Error('Unexpected single quote in fixed-schema dataset');
const output = ['EC_DEMO_MODE="false"', ...chunks.map((value, i) => `EC_DATA_JSON_${i + 1}='${value}'`)].join('\n') + '\n';
fs.writeFileSync(outputPath, output, { mode: 0o600 });
console.log(JSON.stringify({ students: Object.keys(data.students).length, enrollments: input.roster.length, submitted: Object.values(data.students).flat().reduce((n, e) => n + Object.keys(e.items).length, 0), bytes: Buffer.byteLength(serialized), chunks: chunks.length }));
