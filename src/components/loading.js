import { h } from "preact";

import bars from "../assets/bars.svg";

export const Loading = ({ type }) => {
  let message;
  switch (type) {
    case "tree":
      return <div class="spinner"><div class="spinner-icon"></div></div>;
      break;
    case "content":
      return <div class="spinner"><div class="spinner-icon"></div></div>;
    case "tree node":
      return <img class="pt-1 pl-2 w-5 h-5" src={bars} />;
    default:
      console.error("unreachable!");
  }
  return message;
};

export default Loading;
