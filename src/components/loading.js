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
  return <div>{message}</div>;
};

export default Loading;
