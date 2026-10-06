import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const source = (await readFile(new URL("../src/lib/room/ui/components/LoadingScreen.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "")
  .replace("export default function", "function");
const LoadingScreen = vm.runInNewContext(`${source}\nLoadingScreen`, { React });
const find = (element, type) => {
  if (element?.type === type) return element;
  for (const child of React.Children.toArray(element?.props?.children)) {
    const match = find(child, type);
    if (match) return match;
  }
};

test("the central Start page renders immediately without browser APIs or a separate boot page", () => {
  const html = renderToStaticMarkup(React.createElement(LoadingScreen));
  assert.match(html, /Jason Peng Portfolio Showcase/);
  assert.match(html, /Click start to begin/);
  assert.match(html, /role="progressbar"/);
  assert.match(html, /aria-valuenow="0"/);
  assert.match(html, /disabled=""/);
  assert.doesNotMatch(html, /JPBIOS|Checking RAM|LOADING RESOURCES/);
});

test("resource progress alone cannot activate Start or report full readiness", () => {
  let started = false;
  const props = { progress: 1, ready: false, onStart: () => { started = true; } };
  const element = LoadingScreen(props);
  const button = find(element, "button");
  assert.equal(button.props.disabled, true);
  assert.equal(button.props.onClick, undefined);
  assert.equal(started, false);
  assert.match(renderToStaticMarkup(element), /aria-valuenow="99"/);
});

test("readiness completes the progress bar and enables the explicit Start action", () => {
  let starts = 0;
  const element = LoadingScreen({ progress: 0.8, ready: true, onStart: () => { starts++; } });
  const button = find(element, "button");
  assert.equal(starts, 0, "finishing preload does not automatically launch the room");
  assert.equal(button.props.disabled, false);
  assert.match(renderToStaticMarkup(element), /aria-valuenow="100"/);
  button.props.onClick();
  assert.equal(starts, 1);
});
