import { h } from "preact";

export const Error = ({ message }) => {
  return <div class="flex flex-1 items-center justify-center"><p class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{message}</p></div>;
};

export default Error;
