import { h, createContext } from "preact";
import { useReducer, useCallback } from "preact/hooks";
import { gql, useQuery, useLazyQuery } from "@apollo/client";

const getParent = path => {
  let parts = path.split("/");
  parts.pop();
  if (parts.length > 0) {
    return parts.pop();
  }
  return "";
};

const initialState = {
  data: {
    root: null,
    content: null,
    name: null
  }
};

const reducer = (state, action) => {
  let newState = Object.assign({}, state);
  switch (action.type) {
    case "RECV_ROOT":
      newState.data.root =
        action.data.repo.node?.entries ?? action.data.repo.parent?.entries;
      if (action.data.repo.node?.text) {
        newState.data.content = action.data.repo.node?.text;
        // to get the name we have to find this blob in the list of parents, I guess
        action.data.repo.parent.entries.forEach(e => {
          if (e.oid === action.data.repo.node.oid) {
            newState.data.name = e.name;
          }
        });
      } else {
        newState.data.content = action.data.repo.readme?.text;
        // TODO: determine this automatically -- adding the oid to the query
        // makes everything screw up for some reason
        newState.data.name = "README.md";
      }
      return newState;
    case "RECV_CONTENT":
      newState.data.content = action.data.repo.content.text;
      return newState;
    case "RECV_SUBTREE":
      newState.data[action.oid] = action.data;
      return newState;
    case "SET_NAME":
      newState.data.name = action.name;
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

const GithubStore = ({ owner, repo_name, path, children }) => {
  const [state, dispatch] = useReducer(withLogging, initialState);

  // I think it makes more sense to use the callback-style onCompleted,
  // onError, etc. here because nothing can really benefit from the declarative
  // state.
  useQuery(
    INITIAL_QUERY,
    {
      variables: {
        owner,
        repo_name,
        initialRoot: `HEAD:${path}`,
        rootParent: `HEAD:${getParent(path)}`
      },
      onCompleted: data => {
        dispatch({ type: "RECV_ROOT", data });
      },
      onError: err => {
        dispatch({ type: "FETCH_ERROR", error: err });
      }
    },
    [path]
  );

  // TODO: loading states

  const [fetchContent] = useLazyQuery(GET_CONTENT, {
    onCompleted: data => {
      dispatch({ type: "RECV_CONTENT", data });
    }
  });

  // TODO: figure out better names here
  const getContent = useCallback(
    item => {
      dispatch({ type: "SET_NAME", name: item.name });
      fetchContent({ variables: { owner, repo_name, oid: item.oid } });
    },
    [fetchContent, owner, repo_name]
  );

  // TODO: handle error and loading

  let [fetchSubtree] = useLazyQuery(GET_TREE, {
    onCompleted: data => {
      dispatch({
        type: "RECV_SUBTREE",
        oid: data.repo.node.oid,
        data: data.repo.node.entries
      });
    }
  });

  const getSubtree = useCallback(
    item => {
      fetchSubtree({
        variables: { owner, repo_name, oid: item.oid }
      });
    },
    [fetchSubtree, owner, repo_name]
  );

  return (
    <GithubContext.Provider
      value={{
        data: state.data,
        fetchContent: getContent,
        fetchSubtree: getSubtree
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

const INITIAL_QUERY = gql`
  query RepoFiles(
    $owner: String!
    $repo_name: String!
    $initialRoot: String!
    $rootParent: String!
  ) {
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
      readme: object(expression: "HEAD:README.md") {
        ... on Blob {
          text
        }
      }
      readmeNoSuffix: object(expression: "HEAD:README") {
        ... on Blob {
          text
        }
      }
      readmeLowercase: object(expression: "HEAD:readme.md") {
        ... on Blob {
          text
        }
      }
      parent: object(expression: $rootParent) {
        ... on Tree {
          ...TreeEntries
        }
      }
      node: object(expression: $initialRoot) {
        oid
        ... on Blob {
          text
        }
        ... on Tree {
          ...TreeEntries
        }
      }
    }
  }
  fragment TreeEntries on Tree {
    entries {
      name
      oid
      type
    }
  }
`;

const GET_CONTENT = gql`
  query Content($owner: String!, $repo_name: String!, $oid: GitObjectID!) {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      content: object(oid: $oid) {
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
