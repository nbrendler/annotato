import { parse, format } from "../src/lib/lp";

const EXAMPLE_JS = `
// Comment 1
var myVar = 2;
// Comment 2
myVar += 1;
`.trim();

const EXAMPLE_LINK = `
# My README
Check out this [repo](https://github.com/owner/repo).
Or this [file](https://github.com/owner1/repo1/blob/master/folder/file.txt)
Or this [folder](https://github.com/owner2/repo2/tree/master/folder/subfolder)

What about this [relative link](./src/some/file.txt)
`.trim();

// Just a couple of simple tests here to make sure the interface isn't broken.
describe("literate programming tests", () => {
  it("parses a simple JS file", () => {
    const result = parse(EXAMPLE_JS, "example.js");

    expect(result).toHaveLength(2);
    expect(result[0].docsText).toEqual("Comment 1\n");
    expect(result[0].codeText).toEqual("var myVar = 2;\n");
    expect(result[1].docsText).toEqual("Comment 2\n");
    expect(result[1].codeText).toEqual("myVar += 1;\n");
  });

  it("formats the file correctly", () => {
    const result = format(parse(EXAMPLE_JS, "example.js"), {
      owner: "owner",
      repo_name: "repo_name",
      gh_ref: "my-ref"
    });

    // Validating the specific HTML seems unnecessary, just making sure that
    // the correct keys were added with values.
    expect(result).toHaveLength(2);
    expect(result[0].docsHtml).toBeTruthy();
    expect(result[0].codeHtml).toBeTruthy();
    expect(result[1].docsHtml).toBeTruthy();
    expect(result[1].codeHtml).toBeTruthy();
  });

  it("rewrites Github links to the root", () => {
    const result = format(parse(EXAMPLE_LINK, "example.md"), {
      owner: "owner",
      repo_name: "repo_name",
      gh_ref: "my-ref"
    });

    expect(result).toHaveLength(1);

    expect(result[0].docsHtml).toEqual(
      expect.stringContaining("/github.com/owner/repo")
    );
  });

  it("rewrites Github links to blobs", () => {
    const result = format(parse(EXAMPLE_LINK, "example.md"), {
      owner: "owner",
      repo_name: "repo_name",
      gh_ref: "my-ref"
    });

    expect(result).toHaveLength(1);

    expect(result[0].docsHtml).toEqual(
      expect.stringContaining(
        "/github.com/owner1/repo1/blob/master/folder/file.txt"
      )
    );
  });

  it("rewrites Github links to trees", () => {
    const result = format(parse(EXAMPLE_LINK, "example.md"), {
      owner: "owner",
      repo_name: "repo_name",
      gh_ref: "my-ref"
    });

    expect(result).toHaveLength(1);

    expect(result[0].docsHtml).toEqual(
      expect.stringContaining(
        "/github.com/owner2/repo2/tree/master/folder/subfolder"
      )
    );
  });

  it("rewrites Github relative links", () => {
    const result = format(parse(EXAMPLE_LINK, "example.md"), {
      owner: "ownerX",
      repo_name: "repoX",
      gh_ref: "my-ref"
    });

    expect(result).toHaveLength(1);

    expect(result[0].docsHtml).toEqual(
      expect.stringContaining(
        "/github.com/ownerX/repoX/blob/my-ref/src/some/file.txt"
      )
    );
  });
});
