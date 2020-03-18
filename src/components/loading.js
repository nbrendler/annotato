import { h } from "preact";

export const Loading = ({ type }) => {
  let message;
  switch (type) {
    case "tree":
      message = "tree loading";
      break;
    case "content":
      message = "content loading";
      break;
    case "tree node":
      message = "node loading";
      break;
    default:
      console.error("unreachable!");
  }
  return <div class="flex pl-4 pt-4 transition ease-in-out duration-700 text-gray-600">{message}</div>;
};

export default Loading;
