import { h } from "preact";
import { Router } from "preact-router";

import Header from "./header";
import Redirect from "./redirect";

// Code-splitting is automated for routes
import Viewer from "../routes/viewer";

const App = () => (
  <div id="app" className="w-full min-h-screen relative flex flex-col">
    <Header />
    <Router>
      <Viewer path="/github.com/:owner/:repo_name/:type?/:gh_ref?/:gh_path*" />
      <Redirect path="/" to="/github.com/nbrendler/annotato" />
    </Router>
  </div>
);

export default App;
