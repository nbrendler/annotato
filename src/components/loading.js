import { h } from "preact";

export const Loading = ({ type }) => {
  let message;
  switch (type) {
    case "tree":
      message = "tree loading";
      break;
    case "content":
      return <img class="pt-4 pl-4 w-8 h-8" src="/assets/bars.svg" />;
      break;
    case "tree node":
      return <img class="pt-1 pl-2 w-5 h-5" src="/assets/bars.svg" />;
      break;
    default:
      console.error("unreachable!");
  }
  return message;
};

export default Loading;
