import marked from "marked";
import highlightjs from "highlightjs";

const SYMBOL = "///?";
const LANG = {
  // Does the line begin with a comment?
  commentMatcher: RegExp(`^\\s*${SYMBOL}\\s?`),
  // Ignore [hashbangs](http://en.wikipedia.org/wiki/Shebang_%28Unix%29) and interpolations...
  commentFilter: /(^#![/]|^\s*#\{)/
};

export const parse = content => {
  let lines = content.split("\n");

  let sections = [];

  let hasCode = "";
  let docsText = "";
  let codeText = "";

  function save() {
    sections.push({ docsText, codeText });
    hasCode = docsText = codeText = "";
  }

  lines.forEach(line => {
    if (line.match(LANG.commentMatcher) && !line.match(LANG.commentFilter)) {
      if (hasCode) {
        save();
      }

      docsText += (line = line.replace(LANG.commentMatcher, "")) + "\n";
      if (/^(---+|===!)$/.test(line)) {
        save();
      }
    } else {
      hasCode = true;
      codeText += line + "\n";
    }
  });
  save();

  console.log("parse", sections);
  return sections;
};

export const format = sections => {
  sections.forEach(s => {
    s.docsHtml = marked(s.docsText);
    s.codeHtml = highlightjs.highlight("bash", s.codeText).value;
  });
  return sections;
};
