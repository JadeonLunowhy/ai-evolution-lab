export function predict(model, point) {
  return model.w.reduce((sum, w, i) => sum + w * point[i], model.b) >= 0 ? 1 : -1;
}

export function perceptronStep(model, point, label, rate = 0.08) {
  const error = label - predict(model, point);
  return { w: model.w.map((w, i) => w + rate * error * point[i]), b: model.b + rate * error };
}

// Valid cross-correlation: the convention used by common CNN layers.
export function convolve(image, kernel) {
  if (!image.length || !kernel.length) return [];
  const kh = kernel.length, kw = kernel[0].length;
  return Array.from({ length: Math.max(0, image.length - kh + 1) }, (_, y) =>
    Array.from({ length: Math.max(0, image[0].length - kw + 1) }, (_, x) =>
      kernel.reduce((sum, row, j) => sum + row.reduce((s, v, i) => s + v * image[y + j][x + i], 0), 0)));
}

export function softmax(values) {
  if (!values.length) return [];
  const max = Math.max(...values), exps = values.map(v => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / total);
}

export function weightedContext(vectors, weights) {
  if (!vectors.length) return [];
  return vectors[0].map((_, j) => vectors.reduce((sum, v, i) => sum + weights[i] * v[j], 0));
}

export function elizaReply(input) {
  const text = String(input ?? '').trim().slice(0, 200);
  if (!text) return { reply: '先写下一句话，我们再看看规则会怎样回应。', rule: 'empty', match: '没有输入' };
  const feel = text.match(/我(?:觉得|感觉|认为)(.+)/);
  if (feel) return { reply: `你为什么觉得${feel[1].replace(/[。！!？?]$/, '')}？`, rule: 'feel', match: '我觉得 / 我感觉 / 我认为 → 提取后半句，再组成问句' };
  const because = text.match(/因为(.+)/);
  if (because) return { reply: `除了${because[1].replace(/[。！!？?]$/, '')}，还有其他原因吗？`, rule: 'because', match: '因为… → 追问其他原因' };
  if (/妈妈|爸爸|父母|家人/.test(text)) return { reply: '可以多说一点你和家人的关系吗？', rule: 'family', match: '家人关键词 → 使用预设的追问模板' };
  if (/你好|您好/.test(text)) return { reply: '你好。最近有什么事让你在意？', rule: 'greeting', match: '问候关键词 → 使用固定开场' };
  return { reply: '这对你来说意味着什么？', rule: 'fallback', match: '未匹配关键词 → 使用通用备用句' };
}

export function qStep(table, state, action, reward, nextState, alpha = 0.25, gamma = 0.9, terminal = false) {
  const target = reward + (terminal ? 0 : gamma * Math.max(...table[nextState]));
  table[state][action] += alpha * (target - table[state][action]);
  return table[state][action];
}

// Exact Bayesian denoiser over an explicit finite data distribution, followed
// by a deterministic DDIM-style reverse step. No neural network is claimed.
export function diffusionStep(x, examples, alpha, nextAlpha) {
  if (!examples.length) return [...x];
  const root = Math.sqrt(alpha), variance = Math.max(1e-8, 1 - alpha);
  const logWeights = examples.map(sample => -sample.reduce((sum, v, i) => sum + (x[i] - root * v) ** 2, 0) / (2 * variance));
  const weights = softmax(logWeights);
  const clean = weightedContext(examples, weights);
  return x.map((v, i) => {
    const epsilon = (v - root * clean[i]) / Math.sqrt(variance);
    return Math.sqrt(nextAlpha) * clean[i] + Math.sqrt(Math.max(0, 1 - nextAlpha)) * epsilon;
  });
}
