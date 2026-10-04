# AI Evolution Lab Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline. Steps use checkboxes. A fresh reviewer checks the finished project.

**Goal:** Deliver the approved AI-history teaching exhibit and publish it to an independent GitHub repository and GitHub Pages.

**Architecture:** Dependency-free static HTML, CSS and ES modules. Curated content is separate from teaching algorithms and experiment controllers. GitHub Actions verifies the project and deploys the static artifact.

**Tech Stack:** HTML, CSS, JavaScript, SVG, Canvas, Node built-in test runner; Playwright for behavioral/browser verification.

**Spec:** docs/design.md

## Global Constraints
- Chinese narrative timeline with 18 nodes, six experiments, primary references.
- No API key, paid service, account or backend required.
- Use relative paths, accessible controls and reduced-motion support.
- Label every teaching simplification and distinguish example outputs from historical ones.
- New public repository and GitHub Pages deployment are authorized.

## Review Focus
- Direct milestone hash navigation and browser back/forward work.
- Empty and unexpected Chinese ELIZA input gives safe, readable replies.
- Experiment resets cancel in-flight runs and restore coherent displays.
- Touch-sized/mobile controls never clip content or cause page overflow.
- Toy diffusion must be identified accurately and never masquerade as Stable Diffusion.

## Task 1: Teaching algorithms
Files: scripts/algorithms.js, tests/algorithms.test.js.
Produces: perceptronStep, predict, convolve, softmax, weightedContext, elizaReply, qStep, diffusionStep.
- [x] Write tests against hand-checked numerical fixtures and empty inputs.
- [x] Watch failing tests; implement real mathematical operations.
- [x] Run node --test and verify all contracts.

## Task 2: Narrative exhibit
Files: index.html, styles.css, scripts/content.js, scripts/app.js, scripts/experiments.js, assets/favicon.svg.
Consumes: mathematical exports. Produces: navigable timeline, six stateful labs and accessible source/details panels.
- [x] Build polished first slice and start retained HTTP preview.
- [x] Add all content and all experiments; verify labels and sources.
- [x] Browser check chapter navigation, experiment changes/resets, responsive/reduced-motion behavior.

## Task 3: Review and publish
Files: README.md, .github/workflows/pages.yml, package.json, .gitignore, .nojekyll.
- [x] Run all tests, syntax checks and browser QA.
- [x] Fresh read-only reviewer; fix significant findings and rerun checks.
- [x] Create repository, commit, push and enable Pages.
- [x] Confirm successful deployment and public HTTP response.
