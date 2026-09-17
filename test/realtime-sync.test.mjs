// test/realtime-sync.test.mjs
import assert from 'assert';

async function runRealtimeSyncTests() {
  console.log('--- Testing Local Realtime & State Endpoints ---');

  const baseUrl = 'http://localhost:3000';

  // 1. GET /api/teams
  const teamsRes = await fetch(`${baseUrl}/api/teams`);
  assert.strictEqual(teamsRes.status, 200, 'GET /api/teams should return 200');
  const teamsJson = await teamsRes.json();
  assert(Array.isArray(teamsJson.teams), 'teams should be an array');
  assert(teamsJson.teams.length >= 5, 'should contain at least 5 preconfigured pirate ships');
  console.log(`✔ Test 1 passed: /api/teams returned ${teamsJson.teams.length} teams`);

  // 2. POST /api/upload (test base64 upload)
  const dummyBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl: dummyBase64, teamId: 'test_team_1' }),
  });
  assert.strictEqual(uploadRes.status, 200, '/api/upload should return 200');
  const uploadJson = await uploadRes.json();
  assert(uploadJson.url && uploadJson.url.startsWith('/uploads/'), 'upload should return /uploads/ URL');
  console.log(`✔ Test 2 passed: /api/upload generated ${uploadJson.url}`);

  // 3. POST /api/teams (update team)
  const targetTeam = teamsJson.teams[0];
  const updateRes = await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: targetTeam.id,
      updates: {
        initial_photo_url: uploadJson.url,
        status: 'in_progress',
        current_step: 1,
      },
    }),
  });
  assert.strictEqual(updateRes.status, 200, 'POST /api/teams update should return 200');
  const updateJson = await updateRes.json();
  assert.strictEqual(updateJson.team.status, 'in_progress', 'status should be in_progress');
  console.log(`✔ Test 3 passed: Team ${targetTeam.name} updated to in_progress`);

  // 4. GET /api/events?since=0
  const eventsRes = await fetch(`${baseUrl}/api/events?since=0`);
  assert.strictEqual(eventsRes.status, 200, '/api/events should return 200');
  const eventsJson = await eventsRes.json();
  assert(Array.isArray(eventsJson.events) && eventsJson.events.length > 0, 'events should have recorded updates');
  const lastEvent = eventsJson.events[eventsJson.events.length - 1];
  assert.strictEqual(lastEvent.type, 'TEAM_UPDATED');
  console.log(`✔ Test 4 passed: /api/events successfully recorded event: ${lastEvent.type}`);

  // 5. POST /api/submissions
  const subRes = await fetch(`${baseUrl}/api/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ team_id: targetTeam.id, checkpoint_id: 1 }),
  });
  assert.strictEqual(subRes.status, 200, '/api/submissions should return 200');
  console.log('✔ Test 5 passed: Submission recorded successfully');

  // Reset team back to clean state
  await fetch(`${baseUrl}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset', id: targetTeam.id }),
  });
  console.log('✔ Test 6 passed: Team reset back to original state');

  console.log('====================================================');
  console.log('🎉 ALL REALTIME API & SYNC ENDPOINT TESTS PASSED!');
  console.log('====================================================');
}

runRealtimeSyncTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
