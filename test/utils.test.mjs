import assert from 'node:assert/strict';

// 1. Test formatElapsedTime logic
function formatElapsedTime(startedAt, finishedAt) {
  if (!startedAt) return '00:00';
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
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

// 2. Test calculateDistanceMeters
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

// Checkpoints seed verification
const checkpoints = [
  {
    step_number: 1,
    title: 'Хойд хаалганы талбай (North Gate Plaza)',
    lat: 39.9922,
    lng: 116.2942,
    qr_token: 'hd_park_alpha_7x',
    question: 'Бээжингийн Хайдян паркийн нийт газар нутгийн хэмжээ ойролцоогоор хэдэн га вэ?',
    options: ['34 га', '12 га', '68 га', '100 га'],
    correct_answer: '34 га',
  },
  {
    step_number: 2,
    title: 'Төв ногоон зүлэг ба нээлттэй тайз (Central Lawn)',
    lat: 39.9885,
    lng: 116.2940,
    qr_token: 'hd_park_stage_c2',
    question: 'Монгол Оюутны Холбооны энэхүү орьентаци арга хэмжээний гол уриа ямар үгтэй вэ?',
    options: ['Хамтдаа урагшаа', 'Эв нэгдэл ба амжилт', 'Нэг баг, Нэг гэр бүл', 'Ирээдүйн эзэд'],
    correct_answer: 'Нэг баг, Нэг гэр бүл',
  },
  {
    step_number: 3,
    title: 'Уламжлалт цагаан будааны тариалангийн бүс (Jingxi Rice Field)',
    lat: 39.9868,
    lng: 116.2925,
    qr_token: 'hd_park_rice_j3',
    question: 'Эрт үед Хайдянд зөвхөн хааны ордонд нийлүүлдэг байсан алдартай будааг юу гэдэг байсан бэ?',
    options: ['Юйцюань улаан тариа', 'Жинси хааны будаа (Jingxi Rice)', 'Хар сарнай', 'Манж цагаан'],
    correct_answer: 'Жинси хааны будаа (Jingxi Rice)',
  },
  {
    step_number: 4,
    title: 'Baidu Apollo AI ухаалаг асар (AI Smart Pavilion)',
    lat: 39.9898,
    lng: 116.2965,
    qr_token: 'hd_park_ai_p4',
    question: 'Хайдян паркт туршигдсан жолоочгүй ухаалаг микро автобусыг юу гэж нэрлэдэг вэ?',
    options: ['Apollo', 'Titan', 'Panda AI', 'CyberVoyage'],
    correct_answer: 'Apollo',
  },
  {
    step_number: 5,
    title: 'Өмнөд бадамлянхуа цөөрөм ба модон гүүр (South Lotus Pond)',
    lat: 39.9855,
    lng: 116.2952,
    qr_token: 'hd_park_lotus_s5',
    question: 'Эрдэнэсийн эрэлд багийн бүх гишүүд эв санаагаа нэгтгэн даалгавраа бүрэн биелүүлж чадсан уу?',
    options: ['Тийм ээ, баг хамтдаа ялсан!', 'Мэдээж, бид шилдэг нь!', 'Баяр хүргэе!'],
    correct_answer: 'Тийм ээ, баг хамтдаа ялсан!',
  },
];

console.log('Running test suite...');

// TEST 1: formatElapsedTime with null
assert.equal(formatElapsedTime(null), '00:00', 'Null started_at should return 00:00');

// TEST 2: formatElapsedTime 75 seconds
const t0 = new Date('2026-09-16T10:00:00Z').toISOString();
const t75 = new Date('2026-09-16T10:01:15Z').toISOString();
assert.equal(formatElapsedTime(t0, t75), '01:15', '75 seconds should format as 01:15');

// TEST 3: formatElapsedTime > 1 hour (3665 seconds = 1 hr 1 min 5 sec)
const t3665 = new Date('2026-09-16T11:01:05Z').toISOString();
assert.equal(formatElapsedTime(t0, t3665), '01:01:05', '3665 seconds should format as 01:01:05');

// TEST 4: Haversine distance between Haidian Park Gate and Central Lawn
// Gate: 39.9922, 116.2942; Stage: 39.9885, 116.2940
const dist = calculateDistanceMeters(39.9922, 116.2942, 39.9885, 116.2940);
console.log(`Calculated distance between Checkpoint 1 & 2: ${dist} meters`);
assert.ok(dist > 350 && dist < 500, 'Distance between Gate and Central stage should be ~410 meters');

// TEST 5: Checkpoints uniqueness and validity
const tokens = new Set();
const stepNumbers = new Set();
for (const cp of checkpoints) {
  assert.ok(cp.step_number > 0, 'Step number must be positive');
  assert.ok(!stepNumbers.has(cp.step_number), `Duplicate step number: ${cp.step_number}`);
  stepNumbers.add(cp.step_number);

  assert.ok(!tokens.has(cp.qr_token), `Duplicate qr_token: ${cp.qr_token}`);
  tokens.add(cp.qr_token);

  // Check coordinates inside Haidian Park bounds
  assert.ok(cp.lat >= 39.980 && cp.lat <= 39.995, `Latitude ${cp.lat} outside Haidian Park range`);
  assert.ok(cp.lng >= 116.290 && cp.lng <= 116.300, `Longitude ${cp.lng} outside Haidian Park range`);

  // Check correct answer exists in options
  assert.ok(cp.options.includes(cp.correct_answer), `Correct answer "${cp.correct_answer}" not found in options for step ${cp.step_number}`);
}

console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
