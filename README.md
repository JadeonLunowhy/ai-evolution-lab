# 智能纪 · AI Evolution Lab

**一座可以操作的人工智能历史博物馆。** 从 1943 年的逻辑神经元，到生成模型和现代推理训练，沿着 18 个精选里程碑理解 AI 的演进。

**在线体验：[jadeonlunowhy.github.io/ai-evolution-lab](https://jadeonlunowhy.github.io/ai-evolution-lab/)**

## 你可以体验什么

- 六个年代章节，18 个历史节点，穿插 AI 寒冬、统计学习与深度学习复兴的背景。
- 每个节点都有事件介绍、原理、意义、能力边界、原始来源与理解检查。
- 六个交互实验：感知机、规则式 ELIZA、卷积滤镜、Q-learning 迷宫、注意力权重、逐步扩散去噪。
- 响应式布局、年代导航、节点深链接、键盘操作与减少动态效果支持。
- 浏览器本地运行，无需 API 密钥、账户或后端。

## 实验的科学边界

| 实验 | 实际运行的过程 | 范围 |
|---|---|---|
| 感知机 | 样本分类和参数更新 | 二维线性分类器，含 XOR 反例 |
| ELIZA | 中文关键词匹配和模板替换 | 教学改编，不是完整原始 ELIZA |
| 卷积 | 真实像素与滤镜的二维互相关计算 | 演示 CNN 常用运算，不复现 AlexNet |
| 迷宫 | Q-learning 的奖励与更新 | 通用强化学习入门，不复现 AlphaGo |
| 注意力 | softmax 和向量加权汇总 | 分数与向量为人工示例，不来自真实语言模型 |
| 扩散 | 显式有限数据分布上的贝叶斯去噪及 DDIM 式反向更新 | 数字模板教学示例，不是 Stable Diffusion，也不含训练后的文生图网络 |

扩散实验把十个数字模板视为已知、等概率的数据分布。对当前带噪图像，按高斯似然求每个模板的后验权重，计算干净图像的条件均值，再进行确定性的反向更新。40 个中间状态由实际数值计算产生，同一种子可以重复查看；它展示去噪思想，而不代表现代扩散模型的完整训练和采样实现。

## 本地运行

需要 Node.js 22.8 或以上版本，推荐 Node.js 24。

```sh
npm start
```

打开 `http://127.0.0.1:4173/ai-evolution-lab/`。这是静态网页，任何支持 ES 模块的 HTTP 静态服务器也可以使用。直接双击 HTML 可能受浏览器本地模块加载限制。

```sh
npm test
npm run check
```

无生产依赖，无需安装包即可运行上述命令。浏览器验收脚本需另外提供 Playwright，并安装 Microsoft Edge；可执行 `node tools/browser-qa.mjs /absolute/path/to/playwright/index.mjs`。它检查全部实验、锚点导航、重置、移动端宽度和减少动态效果。

## 项目结构

```text
index.html                页面入口
styles.css                展览视觉与响应式布局
scripts/content.js        18 个节点、科普与来源
scripts/algorithms.js     可独立测试的教学算法
scripts/experiments.js    六个实验的显示与交互
scripts/app.js            时间线、导航与理解检查
tests/                    数值行为测试
tools/                    本地预览与浏览器验收
docs/                     设计与实现记录
.github/workflows/        GitHub Pages 自动验证与部署
```

## 发布

GitHub Pages 使用 GitHub Actions。推送到 `main` 会运行数值测试、语法检查，打包网页资源并部署。项目全部使用相对资源地址，可以部署到 GitHub Pages 的项目子路径。

## 内容编辑

修改 `scripts/content.js` 中的节点内容。每个节点记录年份、章节、事件说明、机制、意义、边界、原始来源，以及一道理解题。新增历史内容前区分提案、预印本、论文、系统发布和比赛发生的日期；避免把代表性成果描述成唯一的技术起源。

历史选集覆盖 1943—2025，核验日期为 2026-10-04。它不是完整 AI 史，也不声称包含截至核验日的所有最新成果。
