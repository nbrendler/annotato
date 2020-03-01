import { h } from "preact";
import { Link } from "preact-router/match";
import style from "./style";

const Home = () => (
  <div class={style.home}>
    <h1>Learn From Other Code</h1>
    <p>
      Code Is Book Now is a tool for reading and annotating source code on the
      web. It's especially meant to create or consume code written in the{" "}
      <a href="">Literate Programming</a> style.
    </p>
    <h2>Examples</h2>
    <p>
      To get a feel for how this can work, check out some of these projects:
    </p>
    <ul>
      <li>
        <Link href="/v/nbrendler/annotatively">Annotatively</Link>
        <span>the source code for this tool</span>
      </li>
      <li>
        <Link href="/v/jashkenas/docco/docco.js">Docco</Link>
        <span>the inspiration</span>
      </li>
    </ul>
  </div>
);

export default Home;
