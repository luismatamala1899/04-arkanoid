# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Always respond to the user in Spanish in this project.

## Project state

An Arkanoid/Breakout browser game ("juego de Arkanoide") at a very early stage. So far the repo has only assets: no game code, no `index.html`, no build tooling, no package manager, no tests. It is also not a git repository yet. `/spec-impl` needs git, so run `git init` before using it.

## Running

Plain HTML/JS with no build step. Serve the repo root over HTTP rather than opening the file with `file://`. The spritesheet is drawn to an offscreen canvas, and that can be blocked by browser origin rules. Example: `npx serve .` or `python -m http.server`.

## Assets (`assets/`)

- `spritesheet.js` is a classic script, not an ES module. It defines globals: `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` (ms), `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)` and `drawFrame(ctx, frame, x, y, w, h)`.
  - Load it with a `<script>` tag before the game code, and call `loadSpritesheet` before drawing. Both draw functions do nothing until the sheet has loaded.
  - It loads the image from the relative path `assets/spritesheet-breakout.png`, so the HTML page must sit at the repo root.
  - Sprite names for `drawSprite`: `paddle`, `ball`, and `block_<color>`. Colors are `gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink` and `green`.
  - `EXPLOSION_FRAMES[color]` is an array of 4 frames to pass to `drawFrame`. The `gray` entry reuses the `red` frame coordinates.
- `sounds/ball-bounce.mp3` and `sounds/break-sound.mp3` are the sound effects.

## Workflow: spec-driven development

Features are built through two project skills. They live in `.agents/skills/`, are symlinked into `.claude/skills/`, and are pinned in `skills-lock.json` (source: `Klerith/fernando-skills`). Both can only be started by the user.

- `/spec <feature>` designs a spec through clarifying questions and writes it to `specs/NN-slug.md`, following `.agents/skills/spec/template.md`. That template defines the required sections: Scope (In / Out), Data model, Implementation plan, Acceptance criteria, Decisions, and What is not in. Specs start as `Draft`. No code is written in this phase.
- `/spec-impl <NN-slug>` implements a spec only if its status means "Approved". Only the human changes the status. The skill creates and switches to the branch `spec-NN-slug` (unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`). It then implements one plan step at a time and waits for diff review after each step.

Rules for implementation work:

- Never commit unless the user asks.
- Implement what the spec says. Raise disagreements as observations, and put changes into the spec rather than the code.
- When the spec is ambiguous, stop and present options instead of improvising.
- Requests outside the spec's scope go into a future spec, not onto the current branch.
- After the last step, the user checks the acceptance criteria and sets the status to `Implemented`.
