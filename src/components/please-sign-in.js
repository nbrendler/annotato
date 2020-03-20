import { h } from "preact";

import GithubButton from "./gh-button";

export const PleaseSignIn = () => {
  return (
    <div className="flex max-w-lg mx-auto flex-col text-center -mt-16">
      <h6 className="font-bold">Welcome to Annotato</h6>
      <p className="mb-2">
        A tool designed for reading code on GitHub with lots of comments.
      </p>

      <GithubButton />
    </div>
  );
};

export default PleaseSignIn;
