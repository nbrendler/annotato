import { h } from "preact";
import { Link } from "preact-router/match";

const Header = () => (
	<header class="flex max-w-screen-xl justify-between items-center py-4 px-2 border-b">
		<h1 className="text-black font-bold">Code Is Book Now</h1>
		<nav>
			<Link activeClassName="text-purple" href="/">
				Home
			</Link>
		</nav>
	</header>
);

export default Header;
