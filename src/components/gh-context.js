import { h, createContext } from "preact";
import { route } from "preact-router";
import { useEffect, useReducer, useCallback, useMemo } from "preact/hooks";
import { gql, useQuery, useLazyQuery } from "@apollo/client";

const getParents = path => {
  let parts = path.split("/");

  // If it's a blob, we discard the file name
  // If it's a tree, we don't need this result either (it is initialNode in the
  // query)
  parts.pop();

  return parts.reduce((paths, part, idx) => {
    if (idx === 0) {
      paths.push(part);
      return paths;
    }

    let partial = `${paths[idx - 1]}/${part}`;
    paths.push(partial);
    return paths;
  }, []);
};

const initialState = {
  data: {
    root: null,
    content: null,
    name: null
  },
  currentPath: null
};

const reducer = (state, action) => {
  let newState = Object.assign({}, state);
  switch (action.type) {
    case "RECV_ROOT":
      // TODO: probably need to guard against non-existent repos
      newState.data.root = action.data.repo.root.entries;

      newState.data.readme = action.data.repo.readme;

      // Add all of the level information (when given a deep link) to the state.
      // For root queries (just owner and repo name) this is a noop.
      for (let i = 0; i < action.levelCount; i++) {
        const levelData = action.data.repo[`level${i}`];
        newState.data[levelData.oid] = levelData.entries;
      }

      // Scenario: Rendering a link directly to a blob
      if (action.data.repo.blob?.text) {
        newState.data.content = action.data.repo.blob?.text;
        let parent = action.levelCount
          ? action.data.repo[`level${action.levelCount - 1}`]
          : action.data.repo.root;

        // to get the name/oid we have to find this blob in the list of parents
        // We _could_ get the name from the path, but we need the oid anyway so
        // I think this is better/more explicit;
        parent.entries.forEach(e => {
          if (e.oid === action.data.repo.blob.oid) {
            newState.data.name = e.name;
            newState.data.oid = e.oid;
          }
        });
        // Scenario: Rendering a link directly to a tree
      } else if (action.data.repo.tree?.entries) {
        const treeData = action.data.repo.tree;
        newState.data.oid = treeData.oid;
        newState.data[treeData.oid] = treeData.entries;
      } else {
        console.error("unreachable!");
      }

      return newState;
    case "RECV_CONTENT":
      newState.data.content = action.data.repo.content.text;
      newState.data.oid = action.data.repo.content.oid;
      newState.data.name = state.currentPath.split("/").pop();
      return newState;
    case "RECV_SUBTREE":
      newState.data[action.oid] = action.data;
      return newState;
    case "SET_CURRENT_PATH":
      newState.currentPath = action.path;
      return newState;
  }
  return state;
};

const withLogging = (state, action) => {
  const newState = reducer(state, action);
  console.log("ACTION: ", action, state, newState);
  return newState;
};

export const GithubContext = createContext();

/* The props to this component mirror how URLs work on GitHub (GH), so that you
 * can effectively copy/paste from GH to view in the tool.
 *
 * For GraphQL queries, we always need the following info:
 * * The tree entries from the root of the repo to display the left nav
 * * The list of branches and the name of the default branch
 *
 * Anything else is conditional on what props are defined, e.g. we don't need
 * the README contents if the initial load is a file.
 *
 * There are these cases to consider:
 * 1. The root path /github.com/:owner/:repo_name
 * 2. A blob (file) /github.com/:owner/:repo_name/blob/:gh_ref/:gh_path
 * 3. A tree (folder) below the root /github.com/:owner/:repo_name/tree/:gh_ref/:gh_path
 * 4. The root path with a non-default branch /github.com/:owner/:repo_name/tree/:gh_ref
 *
 * For (1), only `owner` and `root` are defined. `gh_ref` will point to the
 * head and we can attempt to find the README file to display as the content.
 * This is the `ROOT_FRAGMENT` below.
 *
 * For (2), we can load the text content of the blob in the initial request. We
 * don't need the README, but we may need to do multiple tree queries to be
 * able to drill down to where the blob is, if the blob is not at the root.
 *
 * For (3), we can attempt to find a README at the level of this tree, and we
 * need multiple tree queries starting at the root to find this subtree.
 *
 * For (4), the query is the same as `ROOT_FRAGMENT` with a different ref supplied.
 *
 * Other considerations:
 * * Paths with trailing slashes should work the same as non-trailing slashes
 */
const GithubStore = ({ owner, repo_name, type, gh_path, gh_ref, children }) => {
  const [state, dispatch] = useReducer(withLogging, initialState);

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
        dispatch({ type: "FETCH_ERROR", error: err });
      }
    },
    [variables]
  );

  // TODO: loading states
  //

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
        fetchContent({
          variables: { owner, repo_name, path: `${gh_ref}:${gh_path}` }
        });
      }
      dispatch({
        type: "SET_CURRENT_PATH",
        path: gh_path
      });
    }
  }, [variables, dispatch, gh_ref, gh_path]);

  const getData = useCallback(
    (item, paths) => {
      if (item.type === "blob") {
        let newPath = ["github.com", owner, repo_name, "blob", gh_ref || "HEAD"]
          .concat(paths)
          .map(encodeURIComponent)
          .join("/");
        route(`/${newPath}`);
      } else {
        const { loading } = fetchSubtree({
          variables: { owner, repo_name, oid: item.oid }
        });
        return loading;
      }
    },
    [dispatch, gh_ref]
  );

  return (
    <GithubContext.Provider
      value={{
        data: state.data,
        path: state.currentPath,
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

  let levels = getParents(gh_path);

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
