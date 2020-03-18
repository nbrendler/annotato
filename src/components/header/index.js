import { h } from "preact";
import { Link } from "preact-router/match";

const Header = () => (
  <header class="flex justify-between items-center p-4 border-b">
    <h1 className="text-black font-bold">Annotato</h1>
    <nav>
      <Link className="py-2 px-4 hover:text-blue-500" activeClassName="text-blue-500" href="/">
        Home
      </Link>
    </nav>
  </header>
);

export default Header;
