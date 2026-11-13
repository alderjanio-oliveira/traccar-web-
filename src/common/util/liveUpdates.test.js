import assert from 'node:assert/strict';
import test from 'node:test';
import { reconnectDelay, shouldReplacePosition } from './liveUpdates.js';

test('reconnection starts quickly, backs off and remains bounded', () => {
  assert.equal(reconnectDelay(0, 0), 1000);
  assert.equal(reconnectDelay(1, 0), 2000);
  assert.equal(reconnectDelay(10, 0), 30000);
  assert.equal(reconnectDelay(10, 1), 36000);
});

test('late snapshots cannot roll a vehicle back after reconnection', () => {
  const previous = { fixTime: '2026-11-12T12:00:10Z' };
  assert.equal(shouldReplacePosition(previous, { fixTime: '2026-11-12T12:00:00Z' }), false);
  assert.equal(shouldReplacePosition(previous, { fixTime: '2026-11-12T12:00:20Z' }), true);
});

test('same fix can update telemetry but older receipt cannot replace it', () => {
  const previous = { fixTime: '2026-11-12T12:00:00Z', serverTime: '2026-11-12T12:00:10Z' };
  assert.equal(
    shouldReplacePosition(previous, { ...previous, serverTime: '2026-11-12T12:00:20Z' }),
    true,
  );
  assert.equal(
    shouldReplacePosition(previous, { ...previous, serverTime: '2026-11-12T12:00:05Z' }),
    false,
  );
  assert.equal(shouldReplacePosition(undefined, previous), true);
});
