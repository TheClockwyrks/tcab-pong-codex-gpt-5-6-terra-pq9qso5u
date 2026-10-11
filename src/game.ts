import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLES,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type MenuRect = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
};
export interface CaromSnapshot extends Omit<CaromState, "ball"> {
  readonly version: number;
  readonly ball:
    | (Omit<BallState, "trail"> & {
        readonly speed: number;
        readonly trail: readonly TrailSample[];
      })
    | null;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, x: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, x: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, x: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, x: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    x: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, x: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, x: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, x: Side, y: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, x: Side, y: number): CaromState;
  setPaddleDriven(s: DeepReadonly<CaromState>, x: Side, y: boolean): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, x: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, x: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, x: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, x: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): MenuRect | null;
}
export const BACKGROUND = "#07111f";
const clamp = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));
const randomSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const makeBall = (): BallState => ({
  x: FIELD_CX,
  y: FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: HOLD_TIME,
  serveSign: randomSign(),
  trail: [],
});
const makeObstacles = (): readonly ObstacleState[] =>
  OBSTACLE_CENTERS.map((c, index) => ({ index, cx: c.x, cy: c.y }));
const initial = (muted = false, simTime = 0, titleIndex = 0): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: titleIndex,
  titleIndex,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: makeBall(),
  obstacles: makeObstacles(),
  simTime,
  muted,
});
const menus = (s: Screen): readonly string[] =>
  s === "title"
    ? TITLE_ITEMS
    : s === "paused"
      ? PAUSE_ITEMS
      : s === "matchover"
        ? MATCHOVER_ITEMS
        : s === "howto"
          ? ["BACK TO TITLE"]
          : [];
const rect = (s: Screen, i: number): MenuRect | null =>
  i < 0 || i >= menus(s).length
    ? null
    : { x: 430, y: (s === "title" ? 310 : 430) + i * 62, w: 420, h: 48 };
const hitItem = (s: Screen, x: number, y: number): number | null => {
  for (let i = 0; i < menus(s).length; i += 1) {
    const r = rect(s, i);
    if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return null;
};
const needBall = (s: DeepReadonly<CaromState>): DeepReadonly<BallState> => {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
};
const copyBall = (
  b: DeepReadonly<BallState>,
  p: Partial<BallState> = {},
): BallState => ({ ...b, ...p, trail: p.trail ?? [...b.trail] });
const withPaddle = (
  s: DeepReadonly<CaromState>,
  side: Side,
  p: PaddleState,
): CaromState => ({ ...s, paddles: { ...s.paddles, [side]: p } });
const integrate = (
  p: DeepReadonly<PaddleState>,
  wanted: number,
  dt: number,
): PaddleState => {
  const cy = clamp(p.cy + wanted * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  return { ...p, cy, vy: cy !== p.cy && dt > 0 ? (cy - p.cy) / dt : 0 };
};
const paddleRect = (side: Side, cy: number) => ({
  x0: side === "left" ? P1_X0 : P2_X0,
  x1: side === "left" ? P1_X1 : P2_X1,
  y0: cy - PADDLE_HALF,
  y1: cy + PADDLE_HALF,
});
const appendTrail = (b: BallState, t: number): BallState => ({
  ...b,
  trail: [...b.trail, { x: b.x, y: b.y, t }].filter(
    (p) => p.t >= t - TRAIL_TIME,
  ),
});
function startMatch(s: DeepReadonly<CaromState>, mode = s.mode): CaromState {
  return {
    ...s,
    mode,
    screen: "countdown",
    resumeScreen: "playing",
    menuIndex: 0,
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: makeBall(),
    paddles: {
      left: { ...s.paddles.left, cy: FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: FIELD_CY, vy: 0 },
    },
  };
}
const toTitle = (s: DeepReadonly<CaromState>): CaromState =>
  initial(s.muted, s.simTime, s.titleIndex);
function movePaddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState["paddles"] {
  const move = (side: Side): PaddleState => {
    const p = s.paddles[side];
    if (p.driven) return integrate(p, p.drivenVy, dt);
    if (side === "left") {
      const up =
        api.input.value("p1-up") ||
        (s.mode === "solo" ? api.input.value("p2-up") : 0);
      const down =
        api.input.value("p1-down") ||
        (s.mode === "solo" ? api.input.value("p2-down") : 0);
      return integrate(p, (down - up) * PADDLE_SPEED, dt);
    }
    if (s.mode === "versus")
      return integrate(
        p,
        (api.input.value("p2-down") - api.input.value("p2-up")) * PADDLE_SPEED,
        dt,
      );
    if (!s.ai.movement) return { ...p, vy: 0 };
    const b = s.ball;
    const track = s.ai.tracking && s.screen === "playing" && b && b.vx > 0;
    const target = track ? b.y - b.vy * AI_REACT : AI_HOME_Y;
    const dead = track ? AI_DEADZONE : AI_HOME_DEADZONE;
    const diff = target - p.cy;
    return integrate(
      p,
      Math.abs(diff) <= dead
        ? 0
        : Math.sign(diff) *
            Math.min(AI_SPEED, Math.abs(diff) / Math.max(dt, 0.000001)),
      dt,
    );
  };
  return { left: move("left"), right: move("right") };
}
type Collision = "paddle" | "wall" | "obstacle" | null;
function rectCollision(
  b: BallState,
  r: { x0: number; x1: number; y0: number; y1: number },
  paddle: Side | null,
  paddleVy: number,
): [BallState, Collision] {
  if (!(
    b.x > r.x0 - BALL_R &&
    b.x < r.x1 + BALL_R &&
    b.y > r.y0 - BALL_R &&
    b.y < r.y1 + BALL_R
  ))
    return [b, null];
  const depths = [
    b.x - (r.x0 - BALL_R),
    r.x1 + BALL_R - b.x,
    b.y - (r.y0 - BALL_R),
    r.y1 + BALL_R - b.y,
  ];
  const f = depths.indexOf(Math.min(...depths));
  if (paddle && f < 2) {
    const speed = Math.min(Math.hypot(b.vx, b.vy) * SPEED_MULT, SPEED_CAP);
    const theta =
      clamp((b.y - (r.y0 + r.y1) / 2) / PADDLE_HALF, -1, 1) * MAX_BOUNCE_ANGLE;
    const dir = paddle === "left" ? 1 : -1;
    return [
      {
        ...b,
        x: paddle === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R,
        vx: dir * speed * Math.cos(theta),
        vy: speed * Math.sin(theta),
        spin: clamp(
          b.spin + paddleVy * SPIN_FROM_PADDLE,
          -SPIN_CLAMP,
          SPIN_CLAMP,
        ),
      },
      "paddle",
    ];
  }
  const kind: Collision = paddle ? "wall" : "obstacle";
  if (f === 0)
    return [{ ...b, x: r.x0 - BALL_R, vx: b.vx > 0 ? -b.vx : b.vx }, kind];
  if (f === 1)
    return [{ ...b, x: r.x1 + BALL_R, vx: b.vx < 0 ? -b.vx : b.vx }, kind];
  if (f === 2)
    return [{ ...b, y: r.y0 - BALL_R, vy: b.vy > 0 ? -b.vy : b.vy }, kind];
  return [{ ...b, y: r.y1 + BALL_R, vy: b.vy < 0 ? -b.vy : b.vy }, kind];
}
function simulate(
  s: DeepReadonly<CaromState>,
  dt: number,
): [BallState | null, Collision, Side | null] {
  if (!s.ball) return [null, null, null];
  let b = copyBall(s.ball);
  let event: Collision = null;
  const n = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * dt) / MAX_SUBSTEP));
  for (let i = 0; i < n; i += 1) {
    const h = dt / n;
    const v = Math.hypot(b.vx, b.vy);
    if (v) {
      const a = (b.spin / v) * h;
      const c = Math.cos(a);
      const q = Math.sin(a);
      b = { ...b, vx: b.vx * c - b.vy * q, vy: b.vx * q + b.vy * c };
    }
    b = {
      ...b,
      spin: b.spin * 0.5 ** (h / SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: BALL_R, vy: -b.vy };
      event ||= "wall";
    } else if (b.y + BALL_R > FIELD_H && b.vy > 0) {
      b = { ...b, y: FIELD_H - BALL_R, vy: -b.vy };
      event ||= "wall";
    }
    let e: Collision;
    [b, e] = rectCollision(
      b,
      paddleRect("left", s.paddles.left.cy),
      "left",
      s.paddles.left.vy,
    );
    event ||= e;
    [b, e] = rectCollision(
      b,
      paddleRect("right", s.paddles.right.cy),
      "right",
      s.paddles.right.vy,
    );
    event ||= e;
    for (const o of s.obstacles) {
      [b, e] = rectCollision(b, OBSTACLES[o.index], null, 0);
      event ||= e;
    }
  }
  return [
    b,
    event,
    b.x - BALL_R > FIELD_W ? "left" : b.x + BALL_R < 0 ? "right" : null,
  ];
}
function activate(s: CaromState, i: number): CaromState {
  if (s.screen === "title") {
    if (i < 2)
      return startMatch({ ...s, titleIndex: i }, i === 0 ? "solo" : "versus");
    if (i === 2) return { ...s, titleIndex: i, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "howto") return toTitle(s);
  if (s.screen === "paused")
    return i === 0
      ? { ...s, screen: s.resumeScreen }
      : i === 1
        ? startMatch(s)
        : toTitle(s);
  if (s.screen === "matchover") return i === 0 ? startMatch(s) : toTitle(s);
  return s;
}
function debugApi(mute: (value: boolean) => void): CaromDebugApi {
  const patch = (
    s: DeepReadonly<CaromState>,
    p: Partial<BallState>,
  ): CaromState => ({ ...s, ball: copyBall(needBall(s), p) });
  return {
    version: CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...s, ball: makeBall() }),
    spawnObstacle: (s, i) => {
      const c = OBSTACLE_CENTERS[i];
      if (!c) throw new Error("Carom: invalid obstacle index");
      return {
        ...s,
        obstacles: [
          ...s.obstacles.filter((o) => o.index !== i),
          { index: i, cx: c.x, cy: c.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => initial(s.muted),
    reconcile: (s) => ({ ...s }),
    setScreen: (s, screen) => ({ ...s, screen }),
    setMode: (s, mode) => ({ ...s, mode }),
    setMenuIndex: (s, menuIndex) => ({ ...s, menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...s, titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...s, resumeScreen }),
    setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...s, winner }),
    setReceiver: (s, receiver) => ({ ...s, receiver }),
    setPaddleCy: (s, side, cy) =>
      withPaddle(s, side, { ...s.paddles[side], cy }),
    setPaddleVy: (s, side, drivenVy) =>
      withPaddle(s, side, { ...s.paddles[side], drivenVy }),
    setPaddleDriven: (s, side, driven) =>
      withPaddle(s, side, { ...s.paddles[side], driven }),
    setBallPosition: (s, x, y) => patch(s, { x, y }),
    setBallVelocity: (s, vx, vy) => patch(s, { vx, vy }),
    setBallSpin: (s, spin) => patch(s, { spin }),
    setBallHeld: (s, held) => patch(s, { held }),
    setBallHoldTimer: (s, holdTimer) => patch(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => patch(s, { serveSign }),
    drawBallServeSign: (s) => patch(s, { serveSign: randomSign() }),
    setAiTracking: (s, tracking) => ({ ...s, ai: { ...s.ai, tracking } }),
    setAiMovement: (s, movement) => ({ ...s, ai: { ...s.ai, movement } }),
    setMuted: (s, muted) => {
      mute(muted);
      return { ...s, muted };
    },
    snapshot: (s) => ({
      ...s,
      version: CAROM_DEBUG_VERSION,
      score: { ...s.score },
      paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
      ai: { ...s.ai },
      obstacles: s.obstacles.map((o) => ({ ...o })),
      ball: s.ball
        ? {
            ...s.ball,
            speed: Math.hypot(s.ball.vx, s.ball.vy),
            trail: s.ball.trail.map((p) => ({ ...p })),
          }
        : null,
    }),
    menuItemRect: (s, i) => rect(s.screen, i),
  };
}
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of ACTIONS)
      api.input.register(name, { keys: [...BINDINGS[name]] });
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 430,
      freqTo: 720,
      gain: 0.12,
      durationMs: 55,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "triangle",
      freq: 230,
      freqTo: 150,
      gain: 0.1,
      durationMs: 45,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "sawtooth",
      freq: 180,
      freqTo: 330,
      gain: 0.09,
      durationMs: 65,
    });
    api.audio.define(CUES.score, {
      wave: "sine",
      freq: 440,
      freqTo: 860,
      gain: 0.16,
      durationMs: 180,
    });
    const d: readonly [string, (s: DeepReadonly<CaromState>) => string][] = [
      ["screen", (s) => s.screen],
      ["mode", (s) => s.mode],
      ["score", (s) => `${s.score.p1}:${s.score.p2}`],
      [
        "ball",
        (s) =>
          s.ball
            ? `${s.ball.x.toFixed(0)},${s.ball.y.toFixed(0)} v${Math.hypot(s.ball.vx, s.ball.vy).toFixed(0)} sp${s.ball.spin.toFixed(0)}`
            : "none",
      ],
      [
        "left paddle",
        (s) =>
          `${s.paddles.left.cy.toFixed(0)} / ${s.paddles.left.vy.toFixed(0)}`,
      ],
      [
        "right paddle",
        (s) =>
          `${s.paddles.right.cy.toFixed(0)} / ${s.paddles.right.vy.toFixed(0)}`,
      ],
    ];
    d.forEach(([n, f]) => api.diagnostics.register(n, f));
    return [initial(), debugApi(() => undefined)];
  },
  update(s, api, dt): CaromState {
    let muted = api.audio.muted();
    if (api.input.pressed("mute")) {
      muted = !muted;
      api.audio.setMuted(muted);
    }
    let n: CaromState = { ...s, simTime: s.simTime + dt, muted };
    const began = s.screen;
    const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
    const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
    const confirm = api.input.pressed("confirm");
    const back = api.input.pressed("back");
    const pause = api.input.pressed("pause");
    if (began === "countdown" || began === "playing") {
      if (pause)
        n = { ...n, screen: "paused", resumeScreen: began, menuIndex: 0 };
    } else if (began === "paused" && (pause || back))
      n = { ...n, screen: s.resumeScreen };
    else if (began === "howto" && (confirm || back)) n = toTitle(n);
    else if (began === "matchover" && back) n = toTitle(n);
    else if (began === "title" || began === "paused" || began === "matchover") {
      const count = menus(began).length;
      if (up) n = { ...n, menuIndex: (s.menuIndex + count - 1) % count };
      else if (down) n = { ...n, menuIndex: (s.menuIndex + 1) % count };
      else if (confirm) n = activate(n, s.menuIndex);
      const p = api.input.pointer();
      const hover = hitItem(began, p.x, p.y);
      if (hover !== null) n = { ...n, menuIndex: hover };
      const samples = api.input.pointerSamples();
      const downSample = samples.find((x) => x.type === "down");
      const upSample = [...samples].reverse().find((x) => x.type === "up");
      if (!confirm && downSample && upSample) {
        const a = hitItem(began, downSample.x, downSample.y);
        const b = hitItem(began, upSample.x, upSample.y);
        if (a !== null && a === b) n = activate({ ...n, menuIndex: a }, a);
      }
    }
    if (n.screen === "countdown" || n.screen === "playing") {
      n = { ...n, paddles: movePaddles(n, api, dt) };
      if (n.ball && n.screen === "countdown") {
        const timer = n.ball.holdTimer - dt;
        if (timer <= 0) {
          const dir = n.receiver === "left" ? -1 : 1;
          n = {
            ...n,
            screen: "playing",
            ball: copyBall(n.ball, {
              held: false,
              holdTimer: 0,
              vx: dir * SERVE_SPEED * Math.cos(SERVE_ANGLE),
              vy: n.ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE),
              trail: [],
            }),
          };
        } else
          n = {
            ...n,
            ball: appendTrail(
              copyBall(n.ball, { holdTimer: timer }),
              n.simTime,
            ),
          };
      } else if (n.ball && n.screen === "playing" && !n.ball.held) {
        const [ball, e, scorer] = simulate(n, dt);
        if (e === "paddle") api.audio.play(CUES.paddleHit);
        else if (e === "wall") api.audio.play(CUES.wallBounce);
        else if (e === "obstacle") api.audio.play(CUES.obstacleBounce);
        if (scorer) {
          api.audio.play(CUES.score);
          const score = {
            p1: n.score.p1 + (scorer === "left" ? 1 : 0),
            p2: n.score.p2 + (scorer === "right" ? 1 : 0),
          };
          const winner =
            score.p1 >= WIN_SCORE && score.p1 - score.p2 >= WIN_LEAD
              ? "left"
              : score.p2 >= WIN_SCORE && score.p2 - score.p1 >= WIN_LEAD
                ? "right"
                : null;
          n = winner
            ? { ...n, score, winner, screen: "matchover", menuIndex: 0, ball }
            : {
                ...n,
                score,
                receiver: scorer === "left" ? "right" : "left",
                ball: makeBall(),
                screen: "countdown",
              };
        } else n = { ...n, ball: ball ? appendTrail(ball, n.simTime) : null };
      }
    }
    return n;
  },
  render(s, api): void {
    renderGame(s, api.ctx);
  },
};
function rounded(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
): void {
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function renderGame(
  s: DeepReadonly<CaromState>,
  c: CanvasRenderingContext2D,
): void {
  c.fillStyle = BACKGROUND;
  c.fillRect(0, 0, FIELD_W, FIELD_H);
  c.strokeStyle = "#244059";
  c.lineWidth = 2;
  c.setLineDash([10, 14]);
  c.beginPath();
  c.moveTo(NET_X, 35);
  c.lineTo(NET_X, FIELD_H - 35);
  c.stroke();
  c.setLineDash([]);
  s.obstacles.forEach((o) =>
    rounded(c, o.cx - 10, o.cy - 70, 20, 140, 10, "#f6a84b"),
  );
  rounded(
    c,
    P1_X0,
    s.paddles.left.cy - PADDLE_HALF,
    P1_X1 - P1_X0,
    PADDLE_HALF * 2,
    8,
    "#40d5ff",
  );
  rounded(
    c,
    P2_X0,
    s.paddles.right.cy - PADDLE_HALF,
    P2_X1 - P2_X0,
    PADDLE_HALF * 2,
    8,
    "#ff5b94",
  );
  if (s.ball) {
    for (let i = 1; i < s.ball.trail.length; i += 1) {
      const a = s.ball.trail[i - 1];
      const b = s.ball.trail[i];
      c.globalAlpha = (i / s.ball.trail.length) * 0.65;
      c.strokeStyle = "#e9f7ff";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = "#f8fcff";
    c.beginPath();
    c.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2);
    c.fill();
  }
  c.textAlign = "center";
  if (s.screen === "title") {
    c.fillStyle = "#e9f7ff";
    c.font = "900 98px system-ui";
    c.fillText(TITLE_TEXT, FIELD_CX, 205);
    c.font = "20px system-ui";
    c.fillStyle = "#7babc5";
    c.fillText("PADDLE DUEL • BEND THE RALLY", FIELD_CX, 242);
  } else if (s.screen === "howto") {
    c.fillStyle = "#e9f7ff";
    c.font = "800 42px system-ui";
    c.fillText("HOW TO PLAY", FIELD_CX, 215);
    c.font = "22px system-ui";
    c.fillStyle = "#c3d7e4";
    [
      "W / S move blue. Arrow keys move pink in Versus.",
      "Paddle motion adds spin — curve around amber bumpers.",
      "First to 11, leading by two, wins. P pauses. M mutes.",
    ].forEach((x, i) => c.fillText(x, FIELD_CX, 285 + i * 38));
  } else {
    c.font = "800 52px system-ui";
    c.fillStyle = "#40d5ff";
    c.fillText(String(s.score.p1), 530, 70);
    c.fillStyle = "#ff5b94";
    c.fillText(String(s.score.p2), 750, 70);
    c.font = "700 16px system-ui";
    c.fillStyle = "#8daabd";
    c.fillText(s.mode === "solo" ? "SOLO • VS AI" : "VERSUS", FIELD_CX, 35);
    if (s.screen === "countdown") {
      c.font = "700 28px system-ui";
      c.fillStyle = "#e9f7ff";
      c.fillText("READY", FIELD_CX, 650);
    }
    if (s.screen === "paused" || s.screen === "matchover") {
      c.fillStyle = "rgba(2, 10, 20, .7)";
      c.fillRect(0, 0, FIELD_W, FIELD_H);
      c.font = "800 46px system-ui";
      c.fillStyle = "#e9f7ff";
      c.fillText(
        s.screen === "paused"
          ? "PAUSED"
          : `${s.winner === "left" ? "BLUE" : "PINK"} WINS`,
        FIELD_CX,
        350,
      );
      if (s.screen === "matchover") {
        c.font = "24px system-ui";
        c.fillText(`${s.score.p1} — ${s.score.p2}`, FIELD_CX, 388);
      }
    }
  }
  const items = menus(s.screen);
  items.forEach((x, i) => {
    const r = rect(s.screen, i);
    if (!r) return;
    const active = i === s.menuIndex;
    rounded(c, r.x, r.y, r.w, r.h, 12, active ? "#d8f4ff" : "#16304a");
    c.fillStyle = active ? "#092238" : "#b7c8d8";
    c.font = "700 21px system-ui";
    c.fillText(x, FIELD_CX, r.y + 31);
  });
}
