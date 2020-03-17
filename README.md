# annotato
[![Netlify Status](https://api.netlify.com/api/v1/badges/11c1e4d4-5928-457e-a3c4-9118a510f247/deploy-status)](https://app.netlify.com/sites/awesome-chandrasekhar-5b459a/deploys)

Annotato is a tool designed for viewing source code on the web that is written
in a [literate programming](https://en.wikipedia.org/wiki/Literate_programming)
style.

Main technologies used are [Preact](https://preactjs.com),
[GraphQL](https://graphql.org) (via [Apollo](https://www.apollographql.com)).

## Motivation

One of the best ways to learn as a developer is to read code that others have
written, doubly so if they've taken the time to expound their work in a literate
style. Understanding code that you didn't write is a very valuable skill. This
tool attempts to help bridge that understanding gap, while also encouraging the
creation of purely expository comments that are designed to teach future readers
of the source code (or yourself, six months later).

Most code out there falls into one of these categories:
1. Very little to no comments. Great for simple programs or scripts with simple
   problems to solve.
2. Lots of focused comments that explain tricky or confusing bits, or attempt to
   document architectural decisions, e.g. "this will trigger when the input is
   null", or "I'm using this algorithm because I believe it performs best given
   these assumptions".
3. Thorough, well-written comments with lots of examples that are designed to be
   used for generated web documentation with tools like Javadoc.
4. Literate-style code. Long, wordy comments (or just prose intermingling with
   source code, if your tooling supports it) to explain theory- or
   math-heavy code, or just the logic of the programmer that wrote it.

In the case of (2), while these comments can be very helpful to someone who's
attempting to _change_ the code, much more can be said to someone who's
attempting to _learn_ from it. Code that falls in bucket (3) is often very
well-organized and not hard to follow for an experienced veteran, but most of
the comments are geared towards those who wish to _use_ the library or tool and
might not explain all the magic that makes it go.

This tool is to help _learn_ from code, so it fits most naturally with code
written in the style of (4). While a lot of the existing literate code out there
is academic, this can work for any kind of program as evidenced by the examples
below. Really, any tech blog or tutorial with lots of code examples could be
reimagined in this way!

## Examples

Here's a few examples of code that are written in this style.

* [backbone.js](/github.com/jashkenas/backbone/blob/master/backbone.js) - This tool was inspired heavily by how Backbone presents
    their docs, using [docco](/github.com/jashkenas/docco/blob/master/docco.js).

* The annotato source code! I recommend starting with the
[data layer stuff](/github.com/nbrendler/annotato/src/components/gh-context.js), which is the main meat of
this tool.

Feel free to open an issue/PR to add other examples!

## Development

To work with the code itself:

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# test the production build locally
npm run serve

# run tests with jest and preact-render-spy
npm run test
```

For detailed explanation on how things work, checkout the [CLI Readme](https://github.com/developit/preact-cli/blob/master/README.md).

### Failure Injections

There are a few failure injections that can be used in dev to test error states
manually.

| Injection Name  | Purpose                                             |
| --------------  | --------------------------------------------------- |
| `gql-error`     | Causes the root GraphQL query to fail.              |
| `content-error` | Causes the next content query to fail.              |
| `content-null`  | Causes the next content query to return null.       |
| `subtree-error` | Causes the next subtree query to fail.              |
| `empty-folder`  | Causes the next subtree query to return no entries. |
