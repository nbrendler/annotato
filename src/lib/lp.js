import highlightjs from "highlightjs";

const md = require("markdown-it")({
  html: true,
  linkify: true,
  typographer: true
});

const defaultLinkRender = function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

const defaultImageRender = md.renderer.rules.image;

// this can be improved to avoid non-repo pages
const githubRootRE = /^https?:\/\/(www\.)?github.com\/([^/]+\/[^/]+)\/?$/;
const githubItemRE = /^https?:\/\/(www\.)?github.com\/([^/]+\/[^/]+)\/(blob|tree)\/([^/]+)\/(.*)$/;

const setRules = (owner, repo, ref) => {
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const attrIndex = tokens[idx].attrIndex("href");

    if (attrIndex > -1) {
      const href = tokens[idx].attrs[attrIndex][1];
      if (href.startsWith(".")) {
        tokens[idx].attrs[attrIndex][1] = href.replace(
          /^./,
          `/github.com/${owner}/${repo}/blob/${ref}`
        );
      } else if (githubRootRE.test(href)) {
        console.log(href);
        const groups = githubRootRE.exec(href);
        tokens[idx].attrs[attrIndex][1] = `/github.com/${groups[2]}`;
      } else if (githubItemRE.test(href)) {
        const groups = githubItemRE.exec(href);
        tokens[idx].attrs[
          attrIndex
        ][1] = `/github.com/${groups[2]}/${groups[3]}/${groups[4]}/${groups[5]}`;
      }
    }
    return defaultLinkRender(tokens, idx, options, env, self);
  };
  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    const attrIndex = tokens[idx].attrIndex("src");

    if (attrIndex > -1) {
      const src = tokens[idx].attrs[attrIndex][1];
      if (src.startsWith(".")) {
        tokens[idx].attrs[attrIndex][1] = src.replace(
          /^./,
          `https://github.com/${owner}/${repo}/raw/${ref}`
        );
      }
    }
    return defaultImageRender(tokens, idx, options, env, self);
  };
};

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

export const format = (sections, { owner, repo_name, gh_ref }) => {
  setRules(owner, repo_name, gh_ref);
  sections.forEach(s => {
    s.docsHtml = md.render(s.docsText);
    s.codeHtml = highlightjs.highlight("bash", s.codeText).value;
  });
  return sections;
};
