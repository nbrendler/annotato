import { h } from "preact";
import { useMemo, useContext } from "preact/hooks";

import { parse, format } from "../../lib/lp.js";
import { GithubContext } from "../gh-context";
import styles from "./styles";

const Content = () => {
  const {
    data: { name, content }
  } = useContext(GithubContext);
  const memoized = useMemo(() => {
    let sections = [];

    sections = format(parse(content, name));
    return sections;
  }, [content, name]);

  let sections = memoized.reduce((acc, section) => {
    acc.push(<p className={styles.sectionItem} innerHTML={section.docsHtml} />);

    // Note: hljs gives the background color
    // docco skips this and just colors the body and
    // adds an absolutely-positioned white rectangle
    acc.push(
      <pre className={`hljs ${styles.sectionItem}`}>
        <code innerHTML={section.codeHtml} />
      </pre>
    );
    return acc;
  }, []);

  return <div className={styles.container}>{sections}</div>;
};

export default Content;
