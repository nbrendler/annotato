import { h, Component } from "preact";
import { useMemo } from "preact/hooks";

import { parse, format } from "../../lib/lp.js";
import styles from "./styles";

export default class LeftNav extends Component {
  componentDidMount() {}

  render({ text = "" }) {
    const memoized = useMemo(() => {
      let sections = format(parse(text));
      return sections;
    }, [text]);

    let sections = memoized.reduce((acc, section) => {
      acc.push(
        <p className={styles.sectionItem} innerHTML={section.docsHtml} />
      );

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
  }
}
