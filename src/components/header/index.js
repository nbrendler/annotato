import { h } from "preact";
import { Link } from "preact-router/match";

import GithubButton from "../gh-button";

const Header = () => (
  <header class="flex justify-between items-center p-4 border-b">
    <h1 className="text-black font-bold">Annotato</h1>
    <nav>
      <GithubButton />
      <Link className="py-2 px-4" activeClassName="text-purple" href="/">
        Home
      </Link>
    </nav>
  </header>
);

export default Header;
