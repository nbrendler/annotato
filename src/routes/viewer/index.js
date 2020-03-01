import { h } from "preact";
import { useState } from "preact/hooks";
import { gql, useQuery, useLazyQuery } from "@apollo/client";

import style from "./style.css";
import LeftNav from "../../components/left-nav";
import Content from "../../components/content";

export const Viewer = ({ owner, repo_name, path }) => {
  const { loading, error, data } = useQuery(INITIAL_QUERY, {
    variables: { owner, repo_name, exp: `HEAD:${path}` }
  });

  const [state, setState] = useState({ oid: null, name: null });
  const [
    getContent,
    { loading: contentLoading, error: contentError, data: contentData }
  ] = useLazyQuery(
    GET_CONTENT,
    {
      variables: { owner, repo_name, oid: state.oid }
    },
    [state.oid]
  );

  // Callback for the folder tree to report new files loading
  function onClick(obj) {
    setState({ oid: obj.oid, name: obj.name });
    getContent();
  }

  if (loading) {
    return <span>loading!</span>;
  }
  let e = error || contentError;
  if (e) {
    return <span>{e.message}</span>;
  }

  console.log(path);

  return (
    <div class={style.viewer}>
      <LeftNav
        owner={owner}
        repo_name={repo_name}
        root={data}
        oid={null}
        onItemClick={onClick}
      />
      <Content
        loading={contentLoading}
        name={state.name || "README.md"}
        text={contentData?.repo.content?.text || data?.repo.readme?.text}
      />
    </div>
  );
};

const INITIAL_QUERY = gql`
  query RepoFiles($owner: String!, $repo_name: String!, $exp: String!) {
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
      items: object(expression: $exp) {
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
const GET_CONTENT = gql`
  query Content($owner: String!, $repo_name: String!, $oid: GitObjectID) {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      content: object(oid: $oid) {
        ... on GitObject {
          oid
        }
        ... on Blob {
          text
        }
      }
    }
  }
`;

export default Viewer;
