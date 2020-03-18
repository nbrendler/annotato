import { h } from "preact";

import LeftNav from "../../components/left-nav";
import Content from "../../components/content";
import PleaseSignIn from "../../components/please-sign-in";
import GithubStore from "../../components/gh-context";

export const Viewer = props => {
  const token = localStorage.getItem("token");

  if (!token) {
    return (
      <div class="flex flex-1 items-center">
        <PleaseSignIn />
      </div>
    );
  }

  return (
    <GithubStore {...props}>
      <div class="flex flex-1">
        <LeftNav />
        <Content />
      </div>
    </GithubStore>
  );
};

export default Viewer;
