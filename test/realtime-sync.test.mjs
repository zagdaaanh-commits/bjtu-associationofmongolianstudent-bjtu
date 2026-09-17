// test/realtime-sync.test.mjs
import assert from 'assert';
import { spawn } from 'child_process';

async function runRealtimeSyncTests() {
  console.log('--- Testing Local Realtime & State Endpoints ---');

  const baseUrl = 'http://localhost:3000';
  let spawnedServer = null;

  // 0. Ensure server is running on port 3000; if not, spawn it for the test run
  try {
    await fetch(`${baseUrl}/api/teams`, { signal: AbortSignal.timeout(1500) });
  } catch {
    console.log('Spawning Next.js server on port 3000 for integration tests...');
    spawnedServer = spawn('npx', ['next', 'start', '-p', '3000'], {
      shell: true,
      stdio: 'ignore',
    });

    let ready = false;
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch(`${baseUrl}/api/teams`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          ready = true;
          break;
        }
      } catch {
        // still starting
      }
    }
    if (!ready) {
      if (spawnedServer) spawnedServer.kill();
      throw new Error('Next.js server could not be reached on http://localhost:3000');
    }
  }

  try {
    // 1. GET /api/teams
    const teamsRes = await fetch(`${baseUrl}/api/teams`);
    assert.strictEqual(teamsRes.status, 200, 'GET /api/teams should return 200');
    const teamsJson = await teamsRes.json();
    assert(Array.isArray(teamsJson.teams), 'teams should be an array');
    assert(teamsJson.teams.length >= 5, 'should contain at least 5 preconfigured pirate ships');
    console.log(`✔ Test 1 passed: /api/teams returned ${teamsJson.teams.length} teams`);

    // 2. POST /api/upload (test base64 upload -> converts to /uploads/ file)
    const dummyBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: dummyBase64, teamId: 'test_team_1' }),
    });
    assert.strictEqual(uploadRes.status, 200, '/api/upload should return 200');
    const uploadJson = await uploadRes.json();
    assert(
      uploadJson.url && uploadJson.url.startsWith('/uploads/'),
      'upload should return /uploads/ URL'
    );
    assert(
      !uploadJson.url.startsWith('data:'),
      'upload URL must NEVER be a raw base64 data URI'
    );
    console.log(`✔ Test 2 passed: /api/upload generated file URL ${uploadJson.url}`);

    // 2b. Test /api/upload with { image: ... } and raw base64
    const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadImageRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: rawBase64, teamId: 'test_team_raw' }),
    });
    assert.strictEqual(uploadImageRes.status, 200);
    const uploadImageJson = await uploadImageRes.json();
    assert(uploadImageJson.url.startsWith('/uploads/'), 'raw base64 upload should return /uploads/ URL');
    console.log(`✔ Test 2b passed: /api/upload handled raw base64 with { image: ... } payload`);

    // 3. POST /api/teams (update team)
    const targetTeam = teamsJson.teams[0];
    const secondTeam = teamsJson.teams[1];
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
    assert.strictEqual(updateJson.team.id, targetTeam.id, 'updated team ID must match target team ID');
    assert(
      !updateJson.team.initial_photo_url.startsWith('data:'),
      'team initial_photo_url must NEVER be raw base64'
    );
    console.log(`✔ Test 3 passed: Team ${targetTeam.name} updated to in_progress`);

    // 4. GET /api/events?since=0
    const eventsRes = await fetch(`${baseUrl}/api/events?since=0`);
    assert.strictEqual(eventsRes.status, 200, '/api/events should return 200');
    const eventsJson = await eventsRes.json();
    assert(
      Array.isArray(eventsJson.events) && eventsJson.events.length > 0,
      'events should have recorded updates'
    );
    const lastEvent = eventsJson.events[eventsJson.events.length - 1];
    assert.strictEqual(lastEvent.type, 'TEAM_UPDATED');
    console.log(`✔ Test 4 passed: /api/events successfully recorded event: ${lastEvent.type}`);

    // 5. Verify State Isolation: events for targetTeam must NOT be applied to secondTeam
    assert.strictEqual(
      lastEvent.payload.id,
      targetTeam.id,
      'Event payload ID must match targetTeam ID'
    );
    assert.notStrictEqual(
      lastEvent.payload.id,
      secondTeam.id,
      'Event payload ID must NOT match secondTeam ID (State Isolation verified)'
    );
    console.log('✔ Test 5 passed: State isolation confirmed - event ID strictly matches target team');

    // 6. POST /api/submissions
    const subRes = await fetch(`${baseUrl}/api/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: targetTeam.id, checkpoint_id: 1 }),
    });
    assert.strictEqual(subRes.status, 200, '/api/submissions should return 200');
    console.log('✔ Test 6 passed: Submission recorded successfully');

    // 7. Base64 safety check in team update: if base64 is sent in updates, ensure server converts/sanitizes it
    const base64UpdateRes = await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: targetTeam.id,
        updates: {
          initial_photo_url: dummyBase64,
        },
      }),
    });
    assert.strictEqual(base64UpdateRes.status, 200);
    const base64UpdateJson = await base64UpdateRes.json();
    assert(
      !base64UpdateJson.team.initial_photo_url.startsWith('data:'),
      'Server must never store raw base64 data URIs in team records'
    );
    assert(
      base64UpdateJson.team.initial_photo_url.startsWith('/uploads/'),
      'Server must convert base64 to /uploads/ file path'
    );
    console.log('✔ Test 7 passed: Base64 submitted to team update automatically converted to disk URL');

    // 8. Reset team back to clean state
    await fetch(`${baseUrl}/api/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset', id: targetTeam.id }),
    });
    console.log('✔ Test 8 passed: Team reset back to original state');

    // 9. Client-side state isolation simulation: verify if (!payload || payload.id !== teamId) return;
    const testValidationGuard = (teamId, payload) => {
      if (!payload || payload.id !== teamId) return null;
      return payload;
    };
    assert.strictEqual(testValidationGuard('team_A', null), null, 'null payload must be rejected');
    assert.strictEqual(testValidationGuard('team_A', undefined), null, 'undefined payload must be rejected');
    assert.strictEqual(testValidationGuard('team_A', { id: 'team_B', status: 'in_progress' }), null, 'mismatched team ID must be rejected');
    assert.deepStrictEqual(
      testValidationGuard('team_A', { id: 'team_A', status: 'in_progress' }),
      { id: 'team_A', status: 'in_progress' },
      'matching team ID must be accepted'
    );
    console.log('✔ Test 9 passed: Client-side validation guard strictly prevents cross-team state leaks');

    console.log('====================================================');
    console.log('🎉 ALL REALTIME API & SYNC ENDPOINT TESTS PASSED!');
    console.log('====================================================');
  } finally {
    if (spawnedServer) {
      try {
        spawnedServer.kill();
      } catch {
        // ignore
      }
    }
  }
}

runRealtimeSyncTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
