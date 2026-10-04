import test from 'node:test';
import assert from 'node:assert/strict';

const a = await import('../scripts/algorithms.js').catch(() => ({}));
function feature(name) { assert.equal(typeof a[name], 'function', `${name} is not implemented`); return a[name]; }

test('perceptron learns from a misclassified sample and leaves correct samples alone', () => {
  const step = feature('perceptronStep');
  const result = step({ w: [0, 0], b: 0 }, [1, 2], -1, 0.1);
  assert.deepEqual(result, { w: [-0.2, -0.4], b: -0.2 });
  assert.deepEqual(step(result, [1, 2], -1, 0.1), result);
});
test('prediction uses the bias and both coordinates', () => {
  const predict = feature('predict');
  assert.equal(predict({ w: [1, -1], b: -0.5 }, [0, 0]), -1);
  assert.equal(predict({ w: [1, -1], b: -0.5 }, [1, 0]), 1);
});
test('convolution produces actual valid filtered pixels', () => {
  const convolve = feature('convolve');
  assert.deepEqual(convolve([[1,2,3],[4,5,6],[7,8,9]], [[1,0],[0,-1]]), [[-4,-4],[-4,-4]]);
});
test('softmax stays finite with large logits and handles an empty list', () => {
  const softmax = feature('softmax');
  assert.deepEqual(softmax([1000,1000]), [0.5,0.5]);
  assert.deepEqual(softmax([]), []);
});
test('attention changes the weighted context when weights change', () => {
  const combine = feature('weightedContext');
  assert.deepEqual(combine([[2,0],[0,4]], [0.25,0.75]), [0.5,3]);
  assert.deepEqual(combine([], []), []);
});
test('ELIZA exposes the matched rule and handles empty or unexpected input', () => {
  const reply = feature('elizaReply');
  assert.equal(reply('我觉得学习很难').rule, 'feel');
  assert.equal(reply('   ').rule, 'empty');
  assert.equal(reply('abcdefg').rule, 'fallback');
  assert.ok(reply('我觉得 <script>你好</script>').reply.includes('<script>'));
});
test('Q-learning distinguishes terminal rewards from bootstrapped transitions', () => {
  const step = feature('qStep');
  const table = [[0,0],[2,4]];
  assert.equal(step(table,0,0,1,1,0.5,0.9,false), 2.3);
  assert.equal(step(table,0,1,1,1,0.5,0.9,true), 0.5);
});
test('diffusion reverse step recovers a known clean sample at the final step', () => {
  const step = feature('diffusionStep');
  const result = step([0.4,-0.2], [[1,-1]], 0.25, 1);
  assert.deepEqual(result, [1,-1]);
});
test('diffusion result is deterministic and remains finite for highly noisy input', () => {
  const step = feature('diffusionStep');
  const x = [1,-1], examples = [[1,1],[-1,-1]];
  assert.deepEqual(step(x,examples,0.01,0.02), step(x,examples,0.01,0.02));
  assert.ok(step(x,examples,0.01,0.02).every(Number.isFinite));
});
