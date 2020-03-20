// # gh-context.js
//
// This file contains the context object that is used to store data we get from
// the Github API, along with the Redux-lite state that comes with the
// `useReducer` hook in Preact. This was my first foray into (p)react hooks and
// using the context so things are a bit messy. Code reviews welcome.
//
// Much of the complexity (I think) stems from my stubborn refusal when
// writing this to have more than one GraphQL request necessary to load the
// initial page. Conceptually things would be simpler if I could do separate
// requests for the content and the tree view, but the tree view actually would
// require `N` requests to render deep links at depth `N`. Thus I ended up with
// the imperative mangling of the GraphQL query (`addLevels`) seen below.
//
// From a code architecture standpoint, I prefer to have all of the code that
// deals with a third party API isolated into as few files as possible. Here
// the context exposes functions that components can use to get data from the
// API but all the GraphQL details are encapsulated, similar to how you might
// use bindActionCreators in Redux to bind UI actions with the dispatcher. This
// gives some flexibility in swapping out parts of this data layer and also
// makes the components themselves more straightforward.

// On imports -- I generally try to follow the convention from Python's PEP8 for
// organizing them, with 3 blocks separated by newlines:
//
// * Standard Library imports (not applicable here)
// * Third Party Libraries (preact, apollo, etc)
// * Imports from elsewhere in this repo (src/lib/util here)
import { h, createContext } from "preact";
import { route } from "preact-router";
import { useEffect, useReducer, useCallback, useMemo } from "preact/hooks";
import { gql, useQuery, useLazyQuery } from "@apollo/client";

import {
  getPathFragments,
  enableFailureInjection,
  createFailureInjection
} from "../lib/util";

// ## The state
// For the state layout I've put most of the API result data into the `data`
// key. `data` will have more children than shown in the initial state as we
// seen below (`RECV_SUBTREE`), but these are the main bits:
// * `data.root` - the list of tree entries that forms the top-level of the tree
// * `data.content` - the current file content (text). It can be null or empty if the file is binary, empty, or just not found.
// * `data.name` - the name of the current file. The extension drives the syntax highlighting
// * `currentPath` - represents the currently focused file or folder (blob or tree, in API parlance), relative to the repository root. Example: when viewing this file in the tool, the path should be `src/components/gh-context.js`.
// * `error` - holds any GraphQL errors for the root query or content query
// * `treeError` - holds any GraphQL errors for the subtree queries. These are kept separate because a failure doesn't affect the rest of the app like a root or content failure does.
//
// > :memo: Using nested state like this for a reducer is something I usually
// > try to avoid, as it can lead to subtle bugs where the sub-object hasn't
// > changed from the root's perspective (because it's a reference), and
// > therefore the app doesn't re-render when you expect. I've sidestepped this
// > by just returning a brand new state (below) in the reducer, which probably
// > is causing more renders than necessary. With a more complicated state I
// > would probably reach for Redux and use Immutable.js to reduce the bugs.
const initialState = {
  data: {
    root: null,
    content: null,
    name: null
  },
  currentPath: null,
  error: null,
  treeError: null
};

// This reducer should be familiar if you're worked with Redux.  There are
// `RECV_*` events that are dispatched whenever we get a successful GraphQL
// result. `SET_*` events do some bookkeeping when the path changes or an error
// occurs.
//
// The root query which fires on the first load changes depending on where
// we're loading the repository root, a file, or a folder directly. This is
// delineated in the scenarios later on.
const reducer = (state, action) => {
  let newState = Object.assign({}, state);
  switch (action.type) {
    case "RECV_ROOT":
      newState.error = null;

      // We don't need to worry about root being null because the repo not
      // existing will cause a GraphQL error.
      newState.data.root = action.data.repo.root.entries;

      // The implicit assumption made by the query is that the README is called
      // `README.md`. Github supports many other names of readme files, but
      // there isn't currently a way to just get the readme, whatever it's
      // called (a regression from the v3 API).
      //
      // More info is [here](https://stackoverflow.com/questions/46248607/how-to-get-readme-md-from-github-graphql-api)
      // I've decided not to try and test for every possible readme name in the
      // query although that would certainly work.
      newState.data.readme = action.data.repo.readme;

      // Add all of the level information (when given a deep link) to the state.
      // For root queries (just owner and repo name) this is a noop.
      for (let i = 0; i < action.levelCount; i++) {
        const levelData = action.data.repo[`level${i}`];
        newState.data[levelData.oid] = levelData.entries;
      }

      // Scenario: Rendering a link directly to a blob
      if (action.data.repo.blob) {
        if (action.data.repo.blob.isBinary) {
          newState.error = {
            type: "content",
            message: "Binary files can't be rendered."
          };
          return newState;
        }
        // text can still be null if the file is empty
        newState.data.content = action.data.repo.blob.text || "";
        let parent = action.levelCount
          ? action.data.repo[`level${action.levelCount - 1}`]
          : action.data.repo.root;

        // to get the name/oid we have to find this blob in the list of parents
        // We _could_ get the name from the path, but we need the oid anyway so
        // I think this is better/more explicit;
        //
        // Getting the name seems to be surprisingly hard using the v4 API?
        // Maybe this is a case to use the REST API.
        parent.entries.forEach(e => {
          if (e.oid === action.data.repo.blob.oid) {
            newState.data.name = e.name;
            newState.data.oid = e.oid;
          }
        });
        // Scenario: Rendering a link directly to a tree
      } else if (action.data.repo.tree) {
        const treeData = action.data.repo.tree;
        newState.data.oid = treeData.oid;
        newState.data[treeData.oid] = treeData.entries;
      } else {
        console.error("unreachable!");
      }

      return newState;
    case "RECV_CONTENT":
      newState.error = null;
      // > :memo: I would like to use the new `?` coalescing operator here to
      // > say `action.data.repo.content?.isBinary` but it doesn't work with the
      // > prod build unless I specify `--no-esm`.
      if (action.data.repo.content && action.data.repo.content.isBinary) {
        newState.error = {
          type: "content",
          message: "Binary files can't be rendered."
        };
      }
      newState.data.content = action.data.repo.content.text || "";
      newState.data.oid = action.data.repo.content.oid;
      newState.data.name = state.currentPath.split("/").pop();
      return newState;
    case "RECV_SUBTREE":
      newState.treeError = null;
      newState.data[action.oid] = action.data;
      return newState;
    case "SET_CURRENT_PATH":
      newState.currentPath = action.path;
      return newState;
    case "SET_ERROR":
      newState.error = action.error;
      return newState;
    case "SET_TREE_ERROR":
      newState.treeError = action.error;
      return newState;
  }
  return state;
};

// Poor man's redux-logger for use in dev
const withLogging = (state, action) => {
  const newState = reducer(state, action);
  console.log("ACTION: ", action, state, newState);
  return newState;
};

export const GithubContext = createContext();

// The props to this component mirror how URLs work on GitHub (GH), so that you
// can effectively copy/paste from GH to view in the tool.
//
// For GraphQL queries, we always need the following info:
// * The tree entries from the root of the repo to display the left nav
// * The list of branches and the name of the default branch
//
// Anything else is conditional on what props are defined, e.g. we don't need
// the README contents if the initial load is a file.
//
// There are these cases to consider:
// 1. The root path /github.com/:owner/:repo_name
// 2. A blob (file) /github.com/:owner/:repo_name/blob/:gh_ref/:gh_path
// 3. A tree (folder) below the root /github.com/:owner/:repo_name/tree/:gh_ref/:gh_path
// 4. The root path with a non-default branch /github.com/:owner/:repo_name/tree/:gh_ref
//
// For (1), only `owner` and `root` are defined. `gh_ref` will point to the
// head and we can attempt to find the README file to display as the content.
// This is the `ROOT_FRAGMENT` below.
//
// For (2), we can load the text content of the blob in the initial request. We
// don't need the README, but we may need to do multiple tree queries to be
// able to drill down to where the blob is, if the blob is not at the root.
//
// For (3), we can attempt to find a README at the level of this tree, and we
// need multiple tree queries starting at the root to find this subtree.
//
// For (4), the query is the same as `ROOT_FRAGMENT` with a different ref supplied.
//
// Other considerations:
// * Paths with trailing slashes should work the same as non-trailing slashes

const GithubStore = ({
  owner,
  repo_name,
  type,
  gh_path,
  gh_ref,
  children,
  matches: { inject }
}) => {
  const [state, dispatch] = useReducer(
    process.env.NODE_ENV === "development" ? withLogging : reducer,
    initialState
  );

  useEffect(() => {
    enableFailureInjection(inject);
  }, [inject]);

  let [variables, levelCount] = useMemo(
    () =>
      getQueryVars(
        owner,
        repo_name,
        type || "tree",
        gh_ref || "HEAD",
        gh_path || ""
      ),
    [owner, repo_name]
  );

  // force a gql server error by giving a non-existent repo
  createFailureInjection("gql-error", () => {
    variables.repo_name = "";
  });

  // I think it makes more sense to use the callback-style onCompleted,
  // onError, etc. here because nothing can really benefit from the declarative
  // state.
  const { loading: rootLoading } = useQuery(
    INITIAL_QUERY,
    {
      variables,
      onCompleted: data => {
        dispatch({ type: "RECV_ROOT", data, levelCount });
      },
      onError: err => {
        dispatch({
          type: "SET_ERROR",
          error: { type: "root", message: err.message }
        });
      }
    },
    [variables]
  );

  const [fetchContent, { loading: contentLoading }] = useLazyQuery(
    GET_CONTENT,
    {
      onCompleted: data => {
        dispatch({ type: "RECV_CONTENT", data });
      }
    }
  );

  const [fetchSubtree] = useLazyQuery(GET_TREE, {
    onCompleted: data => {
      dispatch({
        type: "RECV_SUBTREE",
        oid: data.repo.node.oid,
        data: data.repo.node.entries
      });
    },
    onError: err => {
      dispatch({
        type: "SET_TREE_ERROR",
        error: { message: err.message }
      });
    }
  });

  useEffect(() => {
    if (state.currentPath === null) {
      // set initial values
      dispatch({
        type: "SET_CURRENT_PATH",
        path: gh_path
      });
      return;
    }
    if (state.currentPath !== gh_path) {
      if (type === "blob") {
        const vars = { owner, repo_name, path: `${gh_ref}:${gh_path}` };

        // this will cause the content fetch to fail
        createFailureInjection("content-error", () => {
          vars.repo_name = "";
        });

        // this will make content null in the GQL response, no error
        createFailureInjection("content-null", () => {
          vars.path = "doesnotexist";
        });

        dispatch({ type: "SET_ERROR", error: null });
        fetchContent({
          variables: vars,
          onError: err => {
            dispatch({
              type: "SET_ERROR",
              error: { type: "content", message: err.message }
            });
          }
        });
      }
      dispatch({
        type: "SET_CURRENT_PATH",
        path: gh_path
      });
    }
  }, [
    variables,
    dispatch,
    gh_ref,
    gh_path,
    type,
    state.currentPath,
    fetchContent,
    owner,
    repo_name
  ]);

  const getData = useCallback(
    (item, paths) => {
      if (item.type === "blob") {
        let newPath = ["github.com", owner, repo_name, "blob", gh_ref || "HEAD"]
          .concat(paths)
          .map(encodeURIComponent)
          .join("/");
        route(`/${newPath}`);
      } else {
        let vars = { owner, repo_name, oid: item.oid };

        createFailureInjection("subtree-error", () => {
          vars.repo_name = "";
        });

        dispatch({ type: "SET_TREE_ERROR", error: null });
        fetchSubtree({
          variables: vars
        });
      }
    },
    [dispatch, gh_ref, fetchSubtree, owner, repo_name]
  );

  return (
    <GithubContext.Provider
      value={{
        data: state.data,
        path: state.currentPath,
        owner,
        repo_name,
        error: state.error,
        treeError: state.treeError,
        gh_ref: gh_ref || "HEAD",
        contentLoading,
        rootLoading,
        getData
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

// Generate artificial Level{i} fragment types and add them to the root query
// type. This should be run once only or conflicts occur.
//
// levels: The number of arbitrary levels to add to the root query type, which
// allows us to render the file tree properly when loading a deep link
// directly.
//
// TODO: Maybe it's possible to do this with gql more declaratively?
//
// This wouldn't be necessary if I could figure out a way to include all of
// these paths in the request itself, such as the GH API having an objects
// field which takes an array of expressions.
const addLevels = levels => {
  for (let i = 0; i < levels; i++) {
    const levelDoc = gql`
      fragment Level${i} on Query {
        repo: repository(owner: $owner, name: $repo_name) {
          level${i}: object(expression: $expression${i}) {
            oid
            ... on Tree {
              entries {
                oid
                name
                type
              }
            }
          }
        }
      }
      # Insert a temp query so that we can easily grab this FragmentSpread
      # object and insert it into the main query, along with the var def
      query temp($expression${i}: String) {
        ...Level${i}
      }
    `;

    // Add our new fragment type, if it doesn't exist already
    if (
      INITIAL_QUERY.definitions.filter(
        d => d.name === levelDoc.definitions[0].name
      ).length === 0
    ) {
      INITIAL_QUERY.definitions.push(levelDoc.definitions[0]);

      // Add the corresponding FragmentSpread to the top level of the root query
      INITIAL_QUERY.definitions[0].selectionSet.selections.push(
        levelDoc.definitions[1].selectionSet.selections[0]
      );

      // Add an expression${i} variable to the root query
      INITIAL_QUERY.definitions[0].variableDefinitions.push(
        levelDoc.definitions[1].variableDefinitions[0]
      );
    }
  }
};

const getQueryVars = (owner, repo_name, type, gh_ref, gh_path) => {
  let rootTree = `${gh_ref}:`;
  let initialNode = `${gh_ref}:${gh_path}`;

  let vars = {
    owner,
    repo_name,
    rootTree,
    initialNode,
    isRoot: !gh_path,
    isBlob: type === "blob"
  };

  let levels = getPathFragments(gh_path);

  addLevels(levels.length);

  levels.forEach((level, i) => {
    vars[`expression${i}`] = `${gh_ref}:${level}`;
  });

  return [vars, levels.length];
};

const ROOT_FRAGMENT = gql`
  fragment TreeEntries on Tree {
    entries {
      name
      oid
      type
    }
  }

  fragment InitialRoot on Query {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      default_branch: defaultBranchRef {
        name
      }
      branches: refs(refPrefix: "refs/heads/", first: 100) {
        nodes {
          name
        }
        totalCount
      }
      root: object(expression: $rootTree) {
        oid
        ... on Tree {
          ...TreeEntries
        }
      }
      readme: object(expression: "HEAD:README.md") @include(if: $isRoot) {
        ... on Blob {
          text
        }
      }
      blob: object(expression: $initialNode) @include(if: $isBlob) {
        oid
        ... on Blob {
          text
          isBinary
        }
      }
      tree: object(expression: $initialNode) @skip(if: $isBlob) {
        oid
        ... on Tree {
          ...TreeEntries
        }
      }
    }
  }
`;

const INITIAL_QUERY = gql`
  query InitialData(
    $owner: String!
    $repo_name: String!
    $rootTree: String!
    $isRoot: Boolean!
    $isBlob: Boolean!
    $initialNode: String
  ) {
    ...InitialRoot
  }
  ${ROOT_FRAGMENT}
`;

const GET_CONTENT = gql`
  query Content($owner: String!, $repo_name: String!, $path: String!) {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      content: object(expression: $path) {
        oid
        ... on Blob {
          isBinary
          text
        }
      }
    }
  }
`;

const GET_TREE = gql`
  query RepoItems($owner: String!, $repo_name: String!, $oid: GitObjectID!) {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      node: object(oid: $oid) {
        oid
        ... on Tree {
          entries {
            name
            oid
            type
          }
        }
      }
    }
  }
`;

export default GithubStore;
