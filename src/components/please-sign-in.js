import { h } from "preact";

import GithubButton from "./gh-button";
import Screenshot from "../assets/screenshot.png";

export const PleaseSignIn = () => {
  return (
    <div className="flex max-w-lg mx-auto flex-col text-center -mt-16">
      <h6 className="font-bold">Welcome to Annotato</h6>
      <img src={Screenshot} />
      <p className="mb-2">
        A tool designed for reading GitHub code with lots of comments.
      </p>

      <GithubButton />
    </div>
  );
};

export default PleaseSignIn;
