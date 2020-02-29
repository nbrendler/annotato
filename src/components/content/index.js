import { h } from "preact";
import { useMemo } from "preact/hooks";

import { parse, format } from "../../lib/lp.js";
import styles from "./styles";

const Content = ({ text, loading }) => {
  const memoized = useMemo(() => {
    let sections = [];

    sections = format(parse(text));
    return sections;
  }, [text]);

  // TODO: render a loading image
  if (loading) return "loading!";

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
