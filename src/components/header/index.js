import { h } from "preact";
import { Link } from "preact-router/match";
import style from "./style.css";

const Header = () => (
	<header class="flex max-w-screen-xl justify-between items-center py-4 px-2 border-b">
		<h1 className="text-black font-bold">Code Is Book Now</h1>
		<nav>
			<Link activeClassName={style.active} href="/">
				Home
			</Link>
		</nav>
	</header>
);

export default Header;
