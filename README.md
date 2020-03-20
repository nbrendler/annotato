# annotato
[![Netlify Status](https://api.netlify.com/api/v1/badges/11c1e4d4-5928-457e-a3c4-9118a510f247/deploy-status)](https://app.netlify.com/sites/awesome-chandrasekhar-5b459a/deploys)

Annotato is a tool designed for viewing source code with lots of comments,
whether they are written in a [literate programming](https://en.wikipedia.org/wiki/Literate_programming)
style or just very well-documented.

Main technologies used are [Preact](https://preactjs.com),
[GraphQL](https://graphql.org) (via [Apollo](https://www.apollographql.com)).

## Usage

To view a github repository in the tool, navigate to
`https://annotato.nikbrendler.com/github.com/:owner/:repo`. Some example links
can be found in [Examples](#examples).

## Motivation

Check out [this blog post](https://www.nikbrendler.com/annotato/) to read more
about motivation for using this tool.

## Examples

Here's a few examples of code that are written in this style.

* [backbone.js](https://github.com/jashkenas/backbone/blob/master/backbone.js) - This tool was inspired heavily by how Backbone presents
    their docs, using [docco](https://github.com/jashkenas/docco/blob/master/docco.js).

* The annotato source code! I recommend starting with the
    [data layer stuff](./src/components/gh-context.js), which is the main meat of
    this tool, or the [literate programming stuff](./src/lib/lp.js).

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
manually. To use an injection, add `?inject=${Injection Name}` to the URL.

| Injection Name  | Purpose                                             |
| --------------  | --------------------------------------------------- |
| `gql-error`     | Causes the root GraphQL query to fail.              |
| `content-error` | Causes the next content query to fail.              |
| `content-null`  | Causes the next content query to return null.       |
| `subtree-error` | Causes the next subtree query to fail.              |
