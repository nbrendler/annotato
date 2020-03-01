import marked from "marked";
import highlightjs from "highlightjs";

import languages from "../resources/languages";

const getMatchers = lang => {
  if (Object.keys(languages).indexOf(lang) === -1) {
    console.error(`Could not find matchers for lang: ${lang}`);
    return false;
  }
  let langInfo = languages[lang];

  return {
    commentMatcher: RegExp(`^\\s*${langInfo.symbol}\\s?`),
    commentFilter: /(^#![/]|^\s*#\{)/
  };
};

export const parse = (content, filename) => {
  let sections = [];

  if (!content) {
    return sections;
  }

  let hasCode = "";
  let docsText = "";
  let codeText = "";

  function save() {
    sections.push({ docsText, codeText });
    hasCode = docsText = codeText = "";
  }

  let ext = "." + filename.split(".").pop();

  let matchers = getMatchers(ext);

  // If we don't know what this is, just show the file without attempting to annotate it!
  if (!matchers) {
    codeText = content;
    save();
    return sections;
  }

  let lines = content.split("\n");

  lines.forEach(line => {
    if (
      line.match(matchers.commentMatcher) &&
      !line.match(matchers.commentFilter)
    ) {
      if (hasCode) {
        save();
      }

      docsText += (line = line.replace(matchers.commentMatcher, "")) + "\n";
      if (/^(---+|===!)$/.test(line)) {
        save();
      }
    } else {
      hasCode = true;
      codeText += line + "\n";
    }
  });
  save();

  return sections;
};

export const format = sections => {
  sections.forEach(s => {
    s.docsHtml = marked(s.docsText);
    s.codeHtml = highlightjs.highlight("bash", s.codeText).value;
  });
  return sections;
};
