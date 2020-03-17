import { h } from "preact";
import { useMemo, useContext } from "preact/hooks";

import { parse, format } from "../../lib/lp.js";
import { GithubContext } from "../gh-context";
import Loading from "../loading";
import Error from "../error";

const Content = () => {
  const {
    data,
    path,
    contentLoading,
    contentError,
    rootLoading,
    rootError
  } = useContext(GithubContext);

  let content = data.content;
  let name = data.name;

  // special case for the root
  if (path === "") {
    content = data.readme?.text;
    name = "README.md";
  }
  const memoized = useMemo(() => {
    let sections = [];

    sections = format(parse(content, name));
    return sections;
  }, [content, name]);

  if (rootLoading || contentLoading) {
    return <Loading type="content" />;
  }

  if (rootError || contentError) {
    return <Error message={`whoops! ${rootError || contentError}`} />;
  }

  let sections = memoized.reduce((acc, section) => {
    acc.push(<p className="" innerHTML={section.docsHtml} />);

    // Note: hljs gives the background color
    // docco skips this and just colors the body and
    // adds an absolutely-positioned white rectangle
    acc.push(
      <pre className={`hljs`}>
        <code innerHTML={section.codeHtml} />
      </pre>
    );
    return acc;
  }, []);

  return (
    <div className="markdown w-full flex flex-col lg:flex-row lg:flex-wrap items-stretch">
      {sections}
    </div>
  );
};

export default Content;
