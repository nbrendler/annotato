import { h } from "preact";
import { Link } from "preact-router/match";
import style from "./style";

const Home = () => (
  <div class="mx-auto max-w-5xl p-4 mb-6 flex flex-col text-gray-700">
    <h1 class="font-bold text-xl mb-6">Learn From Other Code</h1>
    <p class="mb-4">
      Code Is Book Now is a tool for reading and annotating source code on the
      web. It's especially meant to create or consume code written in the{" "}
      <a href="">Literate Programming</a> style.
    </p>
    <h2 class="font-bold mb-4">Examples</h2>
    <p>
      To get a feel for how this can work, check out some of these projects:
    </p>
    <ul>
      <li>
        <Link
          href="/v/nbrendler/annotatively"
          class="text-purple-400 hover:text-purple-300"
        >
          • Annotatively
        </Link>
        <span class="pl-2">the source code for this tool</span>
      </li>
      <li>
        <Link
          href="/v/jashkenas/docco/docco.js"
          class="text-purple-400 hover:text-purple-300"
        >
          • Docco
        </Link>
        <span class="pl-2">the inspiration</span>
      </li>
    </ul>
  </div>
);

export default Home;
