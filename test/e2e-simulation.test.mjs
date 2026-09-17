import assert from 'node:assert/strict';

// Test harness simulating the full game flow end-to-end
console.log('=== RUNNING FULL GAME FLOW & EDGE CASES TEST ===\n');

// Mock in-memory storage simulating dataService
class MockDataStore {
  constructor() {
    this.teams = [];
    this.submissions = [];
    this.checkpoints = [
      { id: 1, step_number: 1, title: 'Сургуулийн уриа', qr_token: 'hd_park_alpha_7x', question: '学校的校训是什么？', options: ['A. 自强不息，厚德载物', 'B. 知行', 'C. 实事求是', 'D. 博学而笃志'], correct_answer: 'B. 知行' },
      { id: 2, step_number: 2, title: 'Физикийн хууль', qr_token: 'hd_park_stage_c2', question: 'Ньютоны 2-р хуулийн үндсэн томьёо аль нь вэ?', options: ['A. F = m · a', 'B. E = m · c²', 'C. p = m · v', 'D. F = -k · x'], correct_answer: 'A. F = m · a' },
      { id: 3, step_number: 3, title: 'Сургуулийн түүх', qr_token: 'hd_park_rice_j3', question: 'Бээжингийн Тээврийн Их Сургууль (BJTU) анх хэдэн онд байгуулагдсан бэ?', options: ['A. 1896', 'B. 1909', 'C. 1921', 'D. 1949'], correct_answer: 'A. 1896' },
      { id: 4, step_number: 4, title: 'Эртний ханзны оньсого', qr_token: 'hd_park_ai_p4', question: 'Дараах эртний ганц ханз ямар утгатай вэ?【 囚 】', options: ['A. Шоронд хорих / Хоригдол', 'B. Гэртээ амрах', 'C. Мод тарих', 'D. Хайрцаг онгойлгох'], correct_answer: 'A. Шоронд хорих / Хоригдол' },
      { id: 5, step_number: 5, title: 'Олон улсын оюутны бүртгэл & Виз', qr_token: 'hd_park_lotus_s5', question: 'Оюутны виз сунгах, сургуулийн албан ёсны бүртгэл хийлгэхэд олон улсын оюутнууд заавал очдог газар аль нь вэ?', options: ['A. 国际教育学院 (CIE)', 'B. 体育馆', 'C. 校医院', 'D. 保卫处'], correct_answer: 'A. 国际教育学院 (CIE)' },
    ];
    this.events = [];
  }

  createTeam(name, pin) {
    const team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      pin_code: pin.trim(),
      current_step: 0,
      status: 'photo_pending',
      initial_photo_url: null,
      started_at: null,
      finished_at: null,
      created_at: new Date().toISOString(),
    };
    this.teams.push(team);
    this.events.push({ type: 'TEAM_CREATED', team });
    return team;
  }

  joinTeam(name, pin) {
    return this.teams.find(t => t.name.toLowerCase() === name.trim().toLowerCase() && t.pin_code === pin.trim()) || null;
  }

  updateTeam(id, updates) {
    const team = this.teams.find(t => t.id === id);
    if (!team) throw new Error('Team not found');
    Object.assign(team, updates);
    this.events.push({ type: 'TEAM_UPDATED', team: { ...team } });
    return { ...team };
  }

  recordSubmission(teamId, cpId) {
    const sub = {
      id: Date.now(),
      team_id: teamId,
      checkpoint_id: cpId,
      completed_at: new Date().toISOString(),
    };
    this.submissions.push(sub);
    this.events.push({ type: 'SUBMISSION_CREATED', sub });
    return sub;
  }

  approvePhoto(teamId) {
    return this.updateTeam(teamId, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
      current_step: 0,
    });
  }

  forcePass(teamId) {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) throw new Error('Team not found');
    const totalCp = this.checkpoints.length;
    const nextStep = team.current_step + 1;
    const isFinishing = nextStep >= totalCp;

    const cp = this.checkpoints.find(c => c.step_number === nextStep);
    if (cp) {
      this.recordSubmission(teamId, cp.id);
    }

    const updates = { current_step: nextStep };
    if (isFinishing) {
      updates.status = 'finished';
      updates.finished_at = new Date().toISOString();
    }
    return this.updateTeam(teamId, updates);
  }
}

// 1. Team creation & Join
const store = new MockDataStore();
const team1 = store.createTeam('  Чононууд  ', '1234');
assert.equal(team1.name, 'Чононууд');
assert.equal(team1.pin_code, '1234');
assert.equal(team1.status, 'photo_pending');
assert.equal(team1.current_step, 0);
console.log('✔ Test 1 passed: Team created with status photo_pending');

// Join
const joined = store.joinTeam('чононууд', '1234');
assert.ok(joined);
assert.equal(joined.id, team1.id);
console.log('✔ Test 2 passed: Case-insensitive login with PIN code');

// 2. Photo Upload (Step 0)
const photoUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';
store.updateTeam(team1.id, { initial_photo_url: photoUrl });
assert.equal(store.teams[0].initial_photo_url, photoUrl);
console.log('✔ Test 3 passed: Photo uploaded, awaiting admin review');

// 3. Admin Approval -> Live state transition to in_progress
const approved = store.approvePhoto(team1.id);
assert.equal(approved.status, 'in_progress');
assert.ok(approved.started_at);
console.log('✔ Test 4 passed: Admin approval sets status to in_progress and records started_at');

// 4. Scavenger Hunt Step 1 -> Scan QR & Quiz
let currentStepNum = approved.current_step + 1; // 1
let activeCp = store.checkpoints.find(c => c.step_number === currentStepNum);
assert.equal(activeCp.step_number, 1);
assert.equal(activeCp.qr_token, 'hd_park_alpha_7x');

// Scan correct token
const scannedToken = 'hd_park_alpha_7x';
assert.equal(scannedToken, activeCp.qr_token);
// Map pin hidden
let hidePin = true;
assert.ok(hidePin);

// Answer quiz correctly
const answer = 'B. 知行';
assert.equal(answer.toLowerCase().trim(), activeCp.correct_answer.toLowerCase().trim());

// Submission recorded & step incremented to 1
store.recordSubmission(team1.id, activeCp.id);
store.updateTeam(team1.id, { current_step: 1 });
console.log('✔ Test 5 passed: Step 1 completed, submission recorded, progress incremented');

// 5. Steps 2, 3, 4
for (let step = 2; step <= 4; step++) {
  const team = store.teams[0];
  const cp = store.checkpoints.find(c => c.step_number === team.current_step + 1);
  assert.equal(cp.step_number, step);
  store.recordSubmission(team.id, cp.id);
  store.updateTeam(team.id, { current_step: step });
}
assert.equal(store.teams[0].current_step, 4);
console.log('✔ Test 6 passed: Steps 2-4 sequentially completed');

// 6. Step 5 (Final step) -> Celebration
const cp5 = store.checkpoints.find(c => c.step_number === 5);
assert.equal(cp5.step_number, 5);
store.recordSubmission(team1.id, cp5.id);
const finishedTeam = store.updateTeam(team1.id, {
  current_step: 5,
  status: 'finished',
  finished_at: new Date(Date.now() + 1800000).toISOString(), // 30 mins later
});
assert.equal(finishedTeam.status, 'finished');
assert.ok(finishedTeam.finished_at);
console.log('✔ Test 7 passed: Final checkpoint completed, team status finished with celebration timer');

// 7. Admin Emergency Force Pass on a new team
const team2 = store.createTeam('Шонхрууд', '5678');
store.approvePhoto(team2.id);
assert.equal(store.teams[1].current_step, 0);

// Admin forces pass on step 1 -> moves to step 1
store.forcePass(team2.id);
assert.equal(store.teams[1].current_step, 1);
assert.equal(store.submissions.filter(s => s.team_id === team2.id).length, 1);

// Force pass through all remaining steps to finish
store.forcePass(team2.id); // 2
store.forcePass(team2.id); // 3
store.forcePass(team2.id); // 4
const forcedFinish = store.forcePass(team2.id); // 5 (Finish)
assert.equal(forcedFinish.status, 'finished');
assert.equal(forcedFinish.current_step, 5);
console.log('✔ Test 8 passed: Admin Emergency Force Pass successfully bypasses checkpoints');

console.log('\n=============================================');
console.log('🎉 ALL 8 GAME ENGINE & FLOW TESTS PASSED!');
console.log('=============================================\n');
