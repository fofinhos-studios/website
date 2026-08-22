import { render } from "preact";
import { App } from "./App";
import "./styles/global.css";

const app = document.getElementById("app");

if (!app) {
  throw new Error("App root was not found.");
}

render(<App />, app);
