import { h, Component } from "preact";
import { Router } from "preact-router";

import Header from "./header";
import Redirect from "./redirect";

// Code-splitting is automated for routes
import Viewer from "../routes/viewer";

export default class App extends Component {
  /** Gets fired when the route changes.
   *  @param {Object} event   "change" event from [preact-router](http://git.io/preact-router)
   *  @param {string} event.url The newly routed URL
   */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <div id="app" className="w-full min-h-screen relative flex flex-col">
        <Header />
        <Router onChange={this.handleRoute}>
          <Viewer path="/github.com/:owner/:repo_name/:type?/:gh_ref?/:gh_path*" />
          <Redirect path="/" to="/github.com/nbrendler/annotatively" />
        </Router>
      </div>
    );
  }
}
