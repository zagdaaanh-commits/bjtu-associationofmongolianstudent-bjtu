import assert from 'node:assert/strict';
import { soundFX } from '../src/lib/soundEffects.ts';

console.log('Running Real SoundFX Engine Unit Tests (src/lib/soundEffects.ts)...');

// Test 1: SoundFX Engine singleton verification
assert.strictEqual(typeof soundFX.getMuted, 'function', 'getMuted is a function');
assert.strictEqual(typeof soundFX.setMuted, 'function', 'setMuted is a function');
assert.strictEqual(typeof soundFX.toggleMute, 'function', 'toggleMute is a function');

assert.strictEqual(typeof soundFX.playCoin, 'function', 'playCoin is a function');
assert.strictEqual(typeof soundFX.playChestOpen, 'function', 'playChestOpen is a function');
assert.strictEqual(typeof soundFX.playDiscoveryJingle, 'function', 'playDiscoveryJingle is a function');
assert.strictEqual(typeof soundFX.playButtonTap, 'function', 'playButtonTap is a function');
assert.strictEqual(typeof soundFX.playWrong, 'function', 'playWrong is a function');
assert.strictEqual(typeof soundFX.playVictory, 'function', 'playVictory is a function');

// Test 2: Initial mute state
assert.strictEqual(soundFX.getMuted(), false, 'SoundFX should initially be unmuted');

// Test 3: Play sounds when unmuted in Node / SSR environment (safe execution, returns true)
assert.strictEqual(soundFX.playCoin(), true, 'playCoin returns true when unmuted');
assert.strictEqual(soundFX.playChestOpen(), true, 'playChestOpen returns true when unmuted');
assert.strictEqual(soundFX.playDiscoveryJingle(), true, 'playDiscoveryJingle returns true when unmuted');
assert.strictEqual(soundFX.playButtonTap(), true, 'playButtonTap returns true when unmuted');
assert.strictEqual(soundFX.playWrong(), true, 'playWrong returns true when unmuted');
assert.strictEqual(soundFX.playVictory(), true, 'playVictory returns true when unmuted');

// Test 4: Toggle mute to muted
assert.strictEqual(soundFX.toggleMute(), true, 'toggleMute sets to muted');
assert.strictEqual(soundFX.getMuted(), true, 'getMuted is true');

// Test 5: When muted, sounds are suppressed and return false
assert.strictEqual(soundFX.playCoin(), false, 'playCoin returns false when muted');
assert.strictEqual(soundFX.playChestOpen(), false, 'playChestOpen returns false when muted');
assert.strictEqual(soundFX.playDiscoveryJingle(), false, 'playDiscoveryJingle returns false when muted');
assert.strictEqual(soundFX.playButtonTap(), false, 'playButtonTap returns false when muted');
assert.strictEqual(soundFX.playWrong(), false, 'playWrong returns false when muted');
assert.strictEqual(soundFX.playVictory(), false, 'playVictory returns false when muted');

// Test 6: Unmute and verify recovery
assert.strictEqual(soundFX.toggleMute(), false, 'toggleMute sets to unmuted');
assert.strictEqual(soundFX.getMuted(), false, 'getMuted is false');
assert.strictEqual(soundFX.playCoin(), true, 'playCoin works again after unmuting');

// Test 7: Direct setMuted
soundFX.setMuted(true);
assert.strictEqual(soundFX.getMuted(), true, 'setMuted(true) works');
soundFX.setMuted(false);
assert.strictEqual(soundFX.getMuted(), false, 'setMuted(false) works');

console.log('✅ ALL REAL SOUND ENGINE UNIT TESTS PASSED!');
