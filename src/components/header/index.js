import { h } from "preact";
import { Link } from "preact-router/match";

const Header = () => (
  <header class="flex justify-between items-center p-4 border-b">
    <h1 className="text-black font-bold">
      <Link className="py-2 hover:text-blue-500" activeClassName="text-blue-500" href="/">
        Annotato
      </Link>
    </h1>
  </header>
);

export default Header;
