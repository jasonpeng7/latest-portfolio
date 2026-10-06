import assert from "node:assert/strict";
import test from "node:test";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants.js";
import config from "../next.config.mjs";

test("production builds cannot overwrite the running preview's assets", () => {
  assert.notEqual(config(PHASE_DEVELOPMENT_SERVER).distDir, config(PHASE_PRODUCTION_BUILD).distDir);
});

test("the production server reads the same directory as the production build", () => {
  assert.equal(config(PHASE_PRODUCTION_BUILD).distDir, config(PHASE_PRODUCTION_SERVER).distDir);
});
