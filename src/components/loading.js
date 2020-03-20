import { h } from "preact";

import bars from "../assets/bars.svg";

export const Loading = ({ type }) => {
  let message;
  switch (type) {
    case "tree":
      message = "tree loading";
      break;
    case "content":
      return <img class="pt-4 pl-4 w-8 h-8" src={bars} />;
    case "tree node":
      return <img class="pt-1 pl-2 w-5 h-5" src={bars} />;
    default:
      console.error("unreachable!");
  }
  return message;
};

export default Loading;
