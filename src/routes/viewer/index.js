import { h } from "preact";

import LeftNav from "../../components/left-nav";
import Content from "../../components/content";
import GithubStore from "../../components/gh-context";

export const Viewer = props => {
	return (
		<GithubStore {...props}>
			<div class="px-2 py-4 flex">
				<LeftNav />
				<Content />
			</div>
		</GithubStore>
	);
};

export default Viewer;
