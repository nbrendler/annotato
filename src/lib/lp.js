// # lp.js
//
// This library contains the code we use to 'implement' literate programming
// (lp) -- parsing source code comments in the code into HTML that can be
// displayed in the UI. The code here (and this app in general) is very heavily
// inspired by [Docco.js](https://github.com/jashkenas/docco), which is a bit
// dated, but I admire for its simplicity in solving the problem.

// `parse` uses a very simple algorithm that is ported directly from [Docco's
// implementation](https://github.com/jashkenas/docco/blob/master/docco.litcoffee#main-documentation-generation-functions)
//
// The basic idea is we iterate over the lines of the file, if it matches a
// comment then we start a comment section, and keep collecting lines that
// continue matching comments into that section.
//
// If we find something that's not a comment (and not ignored via the
// `commentFilter` regex, like hashbangs), then we start a new code block. We
// keep collecting lines until we find another comment and start all over. As a
// result, we end up with alternating blocks of `Comment | Code | Comment |
// Code` which are then paired into one `Section(Comment | Code)` and displayed
// in the UI.
//
// This is very limited (doesn't work with multiline comments, for example). I
// would like to come back and improve this a bit if possible, either by
// writing/adopting a proper parser or perhaps using syntax trees.
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

  let ext = `.${filename.split(".").pop()}`;

  let matchers = getMatchers(ext);

  // If we don't recognize the language by extension, just show the file as
  // code without attempting to annotate it.
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

      // Strip out the actual comment symbols
      line = line.replace(matchers.commentMatcher, "");
      docsText += `${line}\n`;
      if (/^(---+|===!)$/.test(line)) {
        save();
      }
    } else {
      hasCode = true;
      codeText += `${line}\n`;
    }
  });
  save();

  return sections;
};

// `format` takes in a parsed groups of sections and adds the HTML bits to them
// that we use for display.
//
// For markdown, we're currently using `markdown-it` for its extensibility. It
// allows us to rewrite links to Github code to keep things in the app and
// attempt to handle relative links that by default only work in the GitHub UI.
//
// For code, we're using `highlight.js` which has the nice feature of being
// able to auto-detect the language from the text. The drawback is its size --
// it current takes up a huge part of the bundle for this app.
export const format = (sections, { owner, repo_name, gh_ref }) => {
  setRules(owner, repo_name, gh_ref);
  sections.forEach(s => {
    s.docsHtml = md.render(s.docsText);
    s.codeHtml = highlightjs.highlightAuto(s.codeText).value;
  });
  return sections;
};

// Here we import `markdown-it` and start laying the groundwork for configuring it.
//
// * `html` indicates whether we should render raw HTML found in the document.
// * `linkify` will make links out of link-like text found in the document.
// * `typographer` does some transformation of quotes that is more appropriate for reading, akin to [smartypants]()
//
// Check the [Full Documentation](https://markdown-it.github.io/markdown-it) to learn more.
//
// A lot of pages on Github use raw HTML in the markdown content, so I've left
// it on as the library claims the output is safe (sanitized to prevent XSS).
const md = require("markdown-it")({
  html: true,
  linkify: true,
  typographer: true
});

// The docs recommend saving the default rules before you change them, because
// other plugins could be modifying the same rules.
const defaultLinkRender = function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

const defaultImageRender = md.renderer.rules.image;

// This regex is used to identify links of the form:
//
//  `https://github.com/${owner}/${repo}`
//
// Once identified, we can replace them with links that point to the same repo,
// but stay in the app.
//
// I think it might hit on some other random GH pages that are not code. In
// that case  we can blacklist some terms from matching the `owner` group.
const githubRootRE = /^https?:\/\/(www\.)?github.com\/([^/]+\/[^/]+)\/?$/;

// This regex matches deep links to blobs or trees of the form:
//
//  `https://github.com/${owner}/${repo}/blob/some/file.txt`
//  `https://github.com/${owner}/${repo}/tree/some/other/folder`
//
//  Only blob and tree are matched and then rewritten to stay in the app. Links
//  to other resources like issues will remain untouched.
const githubItemRE = /^https?:\/\/(www\.)?github.com\/([^/]+\/[^/]+)\/(blob|tree)\/([^/]+)\/(.*)$/;

// `setRules` gets called before parsing the docs markdown-it, and sets up the
// rules for link rewriting.
const setRules = (owner, repo, ref) => {
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const attrIndex = tokens[idx].attrIndex("href");

    if (attrIndex > -1) {
      const href = tokens[idx].attrs[attrIndex][1];

      // Look for relative links starting with a ., and rewrite them to stay in
      // the app. I'm not sure if relative links can be used to point to
      // non-code resources, if that's the case this probably needs a regex,
      // too.
      if (href.startsWith(".")) {
        tokens[idx].attrs[attrIndex][1] = href.replace(
          /^./,
          `/github.com/${owner}/${repo}/blob/${ref}`
        );
      } else if (githubRootRE.test(href)) {
        // Rewrite links to repository roots
        const groups = githubRootRE.exec(href);
        tokens[idx].attrs[attrIndex][1] = `/github.com/${groups[2]}`;
      } else if (githubItemRE.test(href)) {
        // Rewrite deep links to repository blobs or trees
        // This code would benefit from named regex capture groups
        // which are not a thing in JS, AFAIK.
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

      // Rewrite image `src` attributes that start with a . to the actual
      // resource on GitHub. According to my reading of the GitHub ToS,
      // hotlinking like this is not prohibited (especially given the small
      // amount of traffic I expect on this app), but if the bandwidth usage
      // becomes excessive they may shut it off. If not, we can probably just
      // disable image rendering entirely -- it looks nice but this app is
      // mostly about reading. Some repositories have relevant charts and
      // graphs that I would like to show, though.
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

// `getMatchers` is a helper function that we use to find the comment regexes
// (also from docco) based on the file extension.
const getMatchers = ext => {
  if (Object.keys(languages).indexOf(ext) === -1) {
    console.error(`Could not find matchers for lang: ${ext}`);
    return false;
  }
  let langInfo = languages[ext];

  return {
    commentMatcher: RegExp(`^\\s*${langInfo.symbol}\\s?`),
    commentFilter: /(^#![/]|^\s*#\{)/
  };
};

// imports are boring so I've hidden them at the bottom here.
import languages from "../resources/languages";
import highlightjs from "highlightjs";
