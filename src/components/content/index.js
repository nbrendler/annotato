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
    owner,
    repo_name,
    gh_ref,
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
  const [memoized, anyDocs, anyCode] = useMemo(() => {
    let sections = [];

    sections = format(parse(content, name), { owner, repo_name, gh_ref });
    // Check if there's any docs at all, if not we can just render code
    const anyDocs = sections.filter(s => s.docsHtml).length > 0;

    // Check if there's any code at all, if not we can just render docs, like a
    // markdown document
    const anyCode = sections.filter(s => s.codeHtml).length > 0;
    return [sections, anyDocs, anyCode];
  }, [content, name, owner, repo_name, gh_ref]);

  if (rootLoading || contentLoading) {
    return <Loading type="content" />;
  }

  if (rootError || contentError) {
    return <Error message={`whoops! ${rootError || contentError}`} />;
  }

  let sections = memoized.reduce((acc, section) => {
    if (anyDocs) {
      acc.push(<p className="" innerHTML={section.docsHtml} />);
    }

    if (anyCode) {
      // Note: hljs gives the background color
      // docco skips this and just colors the body and
      // adds an absolutely-positioned white rectangle
      acc.push(
        <pre className={`hljs`}>
          <code innerHTML={section.codeHtml} />
        </pre>
      );
    }
    return acc;
  }, []);

  return (
    <div className="markdown w-full flex flex-col lg:flex-row lg:flex-wrap items-stretch">
      {sections}
    </div>
  );
};

export default Content;
