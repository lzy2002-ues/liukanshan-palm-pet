# Shake UI Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-previewable 480×480 handheld-device Mock for avatar onboarding, short continuous conversation, and the full shake-to-encounter flow.

**Architecture:** A Vite + React + TypeScript single-page Mock holds a small device state machine. `src/api/encounterApi.ts` is a mock adapter using the documented request/response DTOs, so future HTTP integration replaces one file rather than screen components. CSS provides the visual system; no speaker, ASR, real model, Zhihu, or ESP32 SDK is connected.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, plain CSS.

**Spec:** `docs/PRD-V1.0.md`, `docs/SHAKE_MODULE_API_CONTRACT.md`

## Global Constraints

- Render a 480×480 ESP32-style screen inside a browser preview; no ESP32 firmware is produced in this task.
- A shake call must use the documented `request_id`, optional `session_id`, `trigger_source`, and `client_triggered_at` fields.
- Screen branching must use returned `content_type`, `source`, and `can_support`, never infer business meaning from title text.
- `pet_avatar_id` values are fixed from `liukanshan_01` through `liukanshan_06`; images are replaceable local presentation placeholders.
- No external API calls, secrets, speaker integration, or automatic Zhihu deep links.
- The device conversation view shows the current user transcript, one short 刘看山 reply, and at most one compact Zhihu card; full history and long content belong to phone/Web.

## Review Focus

- Repeated shake clicks during matching must produce one pending encounter request and leave controls disabled.
- A `peer_post` with `can_support=true` must show support actions and send only an allowed `message_id`.
- A Zhihu encounter must render a source badge and never display support actions.
- An empty encounter must return safely to a retryable soft empty state, rather than invent content.
- Unknown avatar IDs must map to a safe default presentation token.

### Task 1: Scaffold and contract types

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/contracts.ts`, `src/api/encounterApi.ts`, `src/api/encounterApi.test.ts`

**Interfaces:**
- Produces `requestEncounter(input: ShakeRequest): Promise<ShakeResponse>` and `sendSupport(encounterId, input): Promise<SupportResponse>`.

- [x] **Step 1: Write failing adapter tests** for a peer encounter, a Zhihu encounter, an empty encounter, and support idempotency.
- [x] **Step 2: Run `npm test -- --run src/api/encounterApi.test.ts`** and verify failure because the adapter is absent.
- [x] **Step 3: Implement DTO types and a deterministic Mock adapter** that mirrors the API contract.
- [x] **Step 4: Re-run the adapter tests** and verify they pass.
- [x] **Step 5: Commit** contract adapter work.

### Task 2: Build the device state model

**Files:**
- Create: `src/state/deviceReducer.ts`, `src/state/deviceReducer.test.ts`

**Interfaces:**
- Consumes: `ShakeResponse`, `SupportResponse`.
- Produces: `DeviceState`, `DeviceAction`, `deviceReducer(state, action)`.

- [x] **Step 1: Write failing reducer tests** for avatar confirmation, matching lock, peer/Zhihu/empty branching, and support-to-letter transition.
- [x] **Step 2: Run `npm test -- --run src/state/deviceReducer.test.ts`** and verify failure because reducer is absent.
- [x] **Step 3: Implement the minimal reducer**, keeping async API calls outside reducer.
- [x] **Step 4: Re-run reducer tests** and verify they pass.
- [x] **Step 5: Commit** state-model work.

### Task 3: Compose the interactive browser Mock

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/styles.css`
- Create: `src/components/AvatarCarousel.tsx`, `src/components/DeviceShell.tsx`, `src/components/EncounterCard.tsx`, `src/components/LetterScreen.tsx`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes `requestEncounter`, `sendSupport`, and `deviceReducer`.
- Produces browser interaction for avatar onboarding, short conversation, compact Zhihu suggestion, shake, matching, encounter display, support and letter reading.

- [x] **Step 1: Write failing app tests** that select an avatar, continue a short conversation, trigger a Mock shake, and send a support action.
- [x] **Step 2: Run `npm test -- --run src/App.test.tsx`** and verify failure because UI is absent.
- [x] **Step 3: Implement accessible device screens and interaction wiring** using contract fields as `data-*` / visible source labels.
- [x] **Step 4: Implement the 480×480 visual system**: ice-grey canvas, rounded hardware frame, placeholder fox, cards, envelope and no speaker affordance.
- [x] **Step 5: Re-run UI tests** and verify they pass.
- [x] **Step 6: Commit** interactive Mock work.

### Task 4: Verify and document handoff

**Files:**
- Modify: `README.md`, `docs/team-memory.md`

**Interfaces:**
- Documents `npm install`, `npm run dev`, and Mock-to-real adapter replacement point.

- [x] **Step 1: Add run instructions and documented ESP32 / backend handoff boundaries.**
- [x] **Step 2: Run `npm test -- --run` and `npm run build`.**
- [x] **Step 3: Manually preview the primary peer and Zhihu branches.**
- [x] **Step 4: Record outcome in team memory and commit.**

## Self-Review

- Product scope covered: onboarding, device-style UI, shake matching, peer support, Zhihu knowledge card, empty state, and letter receipt all map to Tasks 1–3.
- Excluded scope stays excluded: no real ASR, LLM, Zhihu/HTTP calls, speaker/audio, firmware, or persistent database.
- Contract names are defined in Task 1 and consumed consistently by Tasks 2–3.
- Review-focus edge cases map respectively to the Task 2 reducer tests and Task 1 adapter tests.
