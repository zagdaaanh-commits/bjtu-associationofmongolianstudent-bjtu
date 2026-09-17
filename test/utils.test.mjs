import assert from 'node:assert/strict';

// 1. Test formatElapsedTime logic
function formatElapsedTime(startedAt, finishedAt) {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  if (isNaN(start)) return '00:00';
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  if (isNaN(end)) return '00:00';
  const diffMs = Math.max(0, end - start);

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 2. Test formatDateTime logic
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// 3. Test calculateDistanceMeters
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 4. Safe options parser test
function parseOptions(options) {
  try {
    if (Array.isArray(options)) return options;
    if (typeof options === 'string') return JSON.parse(options);
  } catch {
    return [];
  }
  return [];
}

// Checkpoints seed verification
const checkpoints = [
  {
    step_number: 1,
    title: 'Сургуулийн уриа (North Gate Plaza)',
    lat: 39.9922,
    lng: 116.2942,
    qr_token: 'hd_park_alpha_7x',
    question: '学校的校训是什么？',
    options: [
      'A. 自强不息，厚德载物',
      'B. 知行',
      'C. 实事求是',
      'D. 博学而笃志',
    ],
    correct_answer: 'B. 知行',
  },
  {
    step_number: 2,
    title: 'Физикийн хууль (Central Lawn)',
    lat: 39.9885,
    lng: 116.2940,
    qr_token: 'hd_park_stage_c2',
    question: 'Ньютоны 2-р хуулийн үндсэн томьёо аль нь вэ?',
    options: [
      'A. F = m · a',
      'B. E = m · c²',
      'C. p = m · v',
      'D. F = -k · x',
    ],
    correct_answer: 'A. F = m · a',
  },
  {
    step_number: 3,
    title: 'Сургуулийн түүх (Jingxi Rice Field)',
    lat: 39.9868,
    lng: 116.2925,
    qr_token: 'hd_park_rice_j3',
    question: 'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?',
    options: ['A. 1896', 'B. 1909', 'C. 1921', 'D. 1949'],
    correct_answer: 'A. 1896',
  },
  {
    step_number: 4,
    title: 'Эртний ханзны оньсого (AI Smart Pavilion)',
    lat: 39.9898,
    lng: 116.2965,
    qr_token: 'hd_park_ai_p4',
    question: 'Дараах эртний ганц ханз ямар утгатай вэ?【 囚 】',
    options: [
      'A. Шоронд хорих / Хоригдол',
      'B. Гэртээ амрах',
      'C. Мод тарих',
      'D. Хайрцаг онгойлгох',
    ],
    correct_answer: 'A. Шоронд хорих / Хоригдол',
  },
  {
    step_number: 5,
    title: 'Олон улсын оюутны бүртгэл & Виз (South Lotus Pond)',
    lat: 39.9855,
    lng: 116.2952,
    qr_token: 'hd_park_lotus_s5',
    question: 'Оюутны виз сунгах, сургуулийн албан ёсны бүртгэл хийлгэхэд олон улсын оюутнууд заавал очдог газар аль нь вэ?',
    options: [
      'A. 国际教育学院 (CIE)',
      'B. 体育馆',
      'C. 校医院',
      'D. 保卫处',
    ],
    correct_answer: 'A. 国际教育学院 (CIE)',
  },
];

console.log('Running test suite...');

// TEST 1: formatElapsedTime with null, undefined, invalid string
assert.equal(formatElapsedTime(null), '00:00', 'Null started_at should return 00:00');
assert.equal(formatElapsedTime(undefined), '00:00', 'Undefined started_at should return 00:00');
assert.equal(formatElapsedTime('invalid-date'), '00:00', 'Invalid started_at should return 00:00');
assert.equal(formatElapsedTime('2026-09-16T10:00:00Z', 'invalid-date'), '00:00', 'Invalid finished_at should return 00:00');

// TEST 2: formatElapsedTime 75 seconds
const t0 = new Date('2026-09-16T10:00:00Z').toISOString();
const t75 = new Date('2026-09-16T10:01:15Z').toISOString();
assert.equal(formatElapsedTime(t0, t75), '01:15', '75 seconds should format as 01:15');

// TEST 3: formatElapsedTime > 1 hour (3665 seconds = 1 hr 1 min 5 sec)
const t3665 = new Date('2026-09-16T11:01:05Z').toISOString();
assert.equal(formatElapsedTime(t0, t3665), '01:01:05', '3665 seconds should format as 01:01:05');

// TEST 4: formatDateTime edge cases
assert.equal(formatDateTime(null), '-', 'Null should return -');
assert.equal(formatDateTime(''), '-', 'Empty string should return -');
assert.equal(formatDateTime('invalid'), '-', 'Invalid date should return -');

// TEST 5: Haversine distance between Haidian Park Gate and Central Lawn
const dist = calculateDistanceMeters(39.9922, 116.2942, 39.9885, 116.2940);
console.log(`Calculated distance between Checkpoint 1 & 2: ${dist} meters`);
assert.ok(dist > 350 && dist < 500, 'Distance between Gate and Central stage should be ~410 meters');

// TEST 6: Checkpoints uniqueness and validity
const tokens = new Set();
const stepNumbers = new Set();
for (const cp of checkpoints) {
  assert.ok(cp.step_number > 0, 'Step number must be positive');
  assert.ok(!stepNumbers.has(cp.step_number), `Duplicate step number: ${cp.step_number}`);
  stepNumbers.add(cp.step_number);

  assert.ok(!tokens.has(cp.qr_token), `Duplicate qr_token: ${cp.qr_token}`);
  tokens.add(cp.qr_token);

  assert.ok(cp.lat >= 39.980 && cp.lat <= 39.995, `Latitude ${cp.lat} outside Haidian Park range`);
  assert.ok(cp.lng >= 116.290 && cp.lng <= 116.300, `Longitude ${cp.lng} outside Haidian Park range`);

  assert.ok(cp.options.includes(cp.correct_answer), `Correct answer "${cp.correct_answer}" not found in options for step ${cp.step_number}`);
}

// TEST 7: Safe options parsing
assert.deepEqual(parseOptions(['A', 'B']), ['A', 'B'], 'Array options');
assert.deepEqual(parseOptions('["A", "B"]'), ['A', 'B'], 'Valid JSON string options');
assert.deepEqual(parseOptions('invalid json'), [], 'Malformed JSON string returns empty array without throwing');
assert.deepEqual(parseOptions(null), [], 'Null options returns empty array');

// TEST 8: Leaderboard sorting logic
const mockTeams = [
  { id: '1', name: 'Team A', status: 'finished', started_at: '2026-09-16T10:00:00Z', finished_at: '2026-09-16T10:20:00Z' }, // 20m
  { id: '2', name: 'Team B', status: 'finished', started_at: '2026-09-16T10:00:00Z', finished_at: '2026-09-16T10:15:00Z' }, // 15m (faster)
  { id: '3', name: 'Team C', status: 'in_progress', current_step: 3, started_at: '2026-09-16T10:05:00Z' },
  { id: '4', name: 'Team D', status: 'in_progress', current_step: 4, started_at: '2026-09-16T10:10:00Z' }, // higher step
  { id: '5', name: 'Team E', status: 'photo_pending', current_step: 0 },
];

const sorted = [...mockTeams].sort((a, b) => {
  if (a.status === 'finished' && b.status === 'finished') {
    const timeA = new Date(a.finished_at || 0).getTime() - new Date(a.started_at || 0).getTime();
    const timeB = new Date(b.finished_at || 0).getTime() - new Date(b.started_at || 0).getTime();
    return timeA - timeB;
  }
  if (a.status === 'finished') return -1;
  if (b.status === 'finished') return 1;
  if (a.status === 'in_progress' && b.status === 'in_progress') {
    if (b.current_step !== a.current_step) return b.current_step - a.current_step;
    return new Date(a.started_at || 0).getTime() - new Date(b.started_at || 0).getTime();
  }
  if (a.status === 'in_progress') return -1;
  if (b.status === 'in_progress') return 1;
  return 0;
});

assert.equal(sorted[0].id, '2', 'Team B should be #1 (finished fastest: 15m)');
assert.equal(sorted[1].id, '1', 'Team A should be #2 (finished 20m)');
assert.equal(sorted[2].id, '4', 'Team D should be #3 (in_progress with step 4)');
assert.equal(sorted[3].id, '3', 'Team C should be #4 (in_progress with step 3)');
assert.equal(sorted[4].id, '5', 'Team E should be #5 (photo_pending)');

// TEST 9: Quiz Answer Matching and LaTeX normalization logic
function testAnswerMatch(givenAnswer, correctAnswer) {
  const normalize = (s) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\$/g, '')
      .replace(/\\cdot/g, '·')
      .replace(/\^2/g, '²')
      .replace(/\*/g, '·')
      .replace(/\s+/g, ' ');

  const cleanPrefix = (s) =>
    normalize(s).replace(/^[a-d][.\s:]*/i, '').trim();

  const letterOnly = (s) => {
    const m = s.trim().match(/^([a-d])([.\s:]|$)/i);
    return m ? m[1].toLowerCase() : '';
  };

  return (
    givenAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ||
    normalize(givenAnswer) === normalize(correctAnswer) ||
    (cleanPrefix(givenAnswer).length > 0 && cleanPrefix(givenAnswer) === cleanPrefix(correctAnswer)) ||
    (letterOnly(givenAnswer) !== '' && letterOnly(givenAnswer) === letterOnly(correctAnswer))
  );
}

// Checkpoint 1 (BJTU Motto: 知行)
assert.ok(testAnswerMatch('B. 知行', 'B. 知行'), 'Exact option');
assert.ok(testAnswerMatch('知行', 'B. 知行'), 'Chinese characters only');
assert.ok(testAnswerMatch('B', 'B. 知行'), 'Letter B');
assert.ok(testAnswerMatch('b.', 'B. 知行'), 'Letter b with dot');
assert.ok(!testAnswerMatch('A. 自强不息，厚德载物', 'B. 知行'), 'Wrong option A');

// Checkpoint 2 (Newton 2nd Law: F = m · a)
assert.ok(testAnswerMatch('A. F = m · a', 'A. F = m · a'), 'Exact option');
assert.ok(testAnswerMatch('A. $F = m \\cdot a$', 'A. F = m · a'), 'Option with LaTeX $ and \\cdot');
assert.ok(testAnswerMatch('$F = m \\cdot a$', 'A. F = m · a'), 'LaTeX text only');
assert.ok(testAnswerMatch('F = m · a', 'A. F = m · a'), 'Clean text only');
assert.ok(testAnswerMatch('A', 'A. F = m · a'), 'Letter A');
assert.ok(!testAnswerMatch('B. E = m · c²', 'A. F = m · a'), 'Wrong option B');
assert.ok(!testAnswerMatch('B. $E = m \\cdot c^2$', 'A. F = m · a'), 'Wrong option B LaTeX');

// Checkpoint 3 (BJTU Founded 1896)
assert.ok(testAnswerMatch('A. 1896', 'A. 1896'), 'Exact option 1896');
assert.ok(testAnswerMatch('1896', 'A. 1896'), '1896 only');
assert.ok(testAnswerMatch('A', 'A. 1896'), 'Letter A');
assert.ok(!testAnswerMatch('B. 1909', 'A. 1896'), 'Wrong 1909');

// Checkpoint 4 (Riddle 囚)
assert.ok(testAnswerMatch('A. Шоронд хорих / Хоригдол', 'A. Шоронд хорих / Хоригдол'), 'Exact option 囚');
assert.ok(testAnswerMatch('Шоронд хорих / Хоригдол', 'A. Шоронд хорих / Хоригдол'), 'Text only');
assert.ok(!testAnswerMatch('B. Гэртээ амрах', 'A. Шоронд хорих / Хоригдол'), 'Wrong option B');

// Checkpoint 5 (International Student Office CIE)
assert.ok(testAnswerMatch('A. 国际教育学院 (CIE)', 'A. 国际教育学院 (CIE)'), 'Exact option CIE');
assert.ok(testAnswerMatch('国际教育学院 (CIE)', 'A. 国际教育学院 (CIE)'), 'Text only CIE');
assert.ok(!testAnswerMatch('B. 体育馆', 'A. 国际教育学院 (CIE)'), 'Wrong option B');

console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
