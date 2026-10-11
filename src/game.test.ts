import { describe, expect, it } from "vitest";
import type { InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import { game, type CaromDebugApi, type CaromState } from "./game";

function boot(): [CaromState, CaromDebugApi] {
  const api = {
    input: { register: () => undefined, layout: () => null },
    audio: { define: () => undefined, load: async () => undefined },
    assets: {},
    diagnostics: { register: () => undefined },
    events: {},
    viewport: () => ({}),
  } as unknown as InitApi<import("./game").CaromState>;
  return game.initialize(api) as [CaromState, CaromDebugApi];
}
function frame(): UpdateApi {
  return {
    input: {
      value: () => 0,
      pressed: () => false,
      pointer: () => ({
        x: 0,
        y: 0,
        down: false,
        device: "mouse",
        buttons: [],
      }),
      pointerPressed: () => false,
      pointerReleased: () => false,
      pointerSamples: () => [],
      pointerContacts: () => [],
      wheel: () => ({ x: 0, y: 0 }),
    },
    audio: {
      play: () => undefined,
      loop: () => undefined,
      stop: () => undefined,
      looping: () => false,
      setMuted: () => undefined,
      muted: () => false,
    },
    frame: () => ({ count: 0, timeMs: 0, lastDeltaMs: 0 }),
    viewport: () => ({
      width: 1280,
      height: 720,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    }),
  };
}
describe("Carom simulation", () => {
  it("parks a new ball and exposes it through the debug snapshot", () => {
    const [state, debug] = boot();
    expect(debug.snapshot(state).ball?.held).toBe(true);
    expect(debug.snapshot(state).obstacles).toHaveLength(2);
  });
  it("serves only after the countdown expires", () => {
    const [state, debug] = boot();
    const staged = debug.setScreen(
      debug.setBallHoldTimer(state, 0),
      "countdown",
    );
    const next = game.update(staged, frame(), 1 / 60);
    expect(next.screen).toBe("playing");
    expect(next.ball?.held).toBe(false);
    expect(Math.hypot(next.ball?.vx ?? 0, next.ball?.vy ?? 0)).toBeCloseTo(520);
  });
  it("clamps a driven paddle at the wall", () => {
    const [state, debug] = boot();
    let staged = debug.setPaddleDriven(state, "left", true);
    staged = debug.setPaddleVy(staged, "left", -720);
    const next = game.update(debug.setScreen(staged, "playing"), frame(), 2);
    const pinned = game.update(next, frame(), 1 / 60);
    expect(next.paddles.left.cy).toBe(55);
    expect(pinned.paddles.left.vy).toBe(0);
  });
});
