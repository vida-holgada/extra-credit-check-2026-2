export const DEMO_DATA = {
  asOf: '2026-11-02',
  definitions: {
    science: { name: '과학기술과문명', titles: ['전시 감상문', '중간과제 계획서', null, null, null] },
    ai: { name: '인공지능과현대사회', titles: [null, '특강 감상문', null, null, null] },
  },
  students: {
    '00000001': [{ course: 'science', section: '31004', items: { '1': ['submitted', '2026-09-25 13:24:00', null], '2': ['submitted', '2026-11-01 22:24:17', null] } }],
    '00000002': [{ course: 'science', section: '31005', items: { '1': ['submitted', '2026-09-30 11:06:00', '첨부파일을 다시 확인하고 있습니다.'] } }],
    '00000003': [{ course: 'ai', section: '31001', items: { '2': ['submitted', '2026-09-04 20:30:00', null] } }],
  },
};

export function loadData(env) {
  if (env.EC_DEMO_MODE === 'true') return { data: DEMO_DATA, demo: true };
  const parts = Array.from({ length: 8 }, (_, i) => env[`EC_DATA_JSON_${i + 1}`] || '');
  if (!parts[0]) throw new Error('records_unavailable');
  const data = JSON.parse(parts.join(''));
  if (!data.asOf || !data.definitions || !data.students) throw new Error('invalid_records');
  return { data, demo: false };
}

export function lookup(data, studentId) {
  if (!/^\d{8}$/.test(studentId)) throw new Error('invalid_id');
  if (!Object.hasOwn(data.students, studentId)) return null;
  return data.students[studentId].map(enrollment => {
    const definition = data.definitions[enrollment.course];
    if (!definition) throw new Error('invalid_course');
    return {
      name: definition.name,
      section: enrollment.section,
      assignments: Array.from({ length: 5 }, (_, i) => {
        const number = i + 1;
        const title = definition.titles[i] || null;
        const record = enrollment.items[String(number)];
        return {
          number, title,
          status: record ? record[0] : title ? 'not_submitted' : 'unassigned',
          submittedAt: record ? record[1] : null,
          note: record ? record[2] : null,
        };
      }),
    };
  });
}

export const PRIVATE_HEADERS = {
  'Cache-Control': 'no-store, private, max-age=0',
  'Pragma': 'no-cache',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};
