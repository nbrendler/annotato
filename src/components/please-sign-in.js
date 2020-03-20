import { h } from "preact";

import GithubButton from "./gh-button";
import Screenshot from "../assets/screenshot.png";

export const PleaseSignIn = () => {
  return (
    <div className="flex max-w-lg mx-auto flex-col text-center -mt-16 px-4 lg:px-0">
      <h5 className="font-bold text-xl">Welcome to Annotato</h5>
      <img className="rounded-lg border shadow-lg mt-2 mb-4 transition transform scale-95" src={Screenshot} />
      <p className="mb-6 text-gray-600">
        A tool designed for reading GitHub code with lots of comments.
      </p>

      <GithubButton />
    </div>
  );
};

export default PleaseSignIn;
