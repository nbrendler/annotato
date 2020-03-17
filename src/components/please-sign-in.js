import { h } from "preact";

import GithubButton from "./gh-button";

export const PleaseSignIn = () => {
  // TODO: motivate why you should sign in more
  return (
    <div>
      <p>You need to be signed in to Github to use this tool.</p>
      <GithubButton />
    </div>
  );
};

export default PleaseSignIn;
