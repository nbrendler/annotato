import { h } from "preact";
import { Link } from "preact-router/match";

const Header = () => (
	<header class="flex justify-between items-center p-4 border-b">
		<h1 className="text-black font-bold">Code Is Book Now</h1>
		<nav>
			<Link activeClassName="text-purple" href="/">
				Home
			</Link>
		</nav>
	</header>
);

export default Header;
