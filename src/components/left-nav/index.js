import { h } from "preact";
import { gql, useLazyQuery } from "@apollo/client";

import style from "./style.css";

export const Tree = ({ owner, repo_name, root, onItemClick, item }) => {
  let [getSubtree, { loading, data }] = useLazyQuery(GET_TREE, {
    variables: {
      oid: item?.oid,
      owner,
      repo_name
    }
  });

  if (loading) return <span>loading</span>;

  data = data ?? root;

  const onClick = item => e => {
    e.stopPropagation();
    if (item.type === "tree") {
      getSubtree();
    } else {
      onItemClick(item);
    }
  };

  let children =
    data &&
    data.repo.items.entries.map(i => {
      return (
        <Tree
          owner={owner}
          repo_name={repo_name}
          item={i}
          onItemClick={onItemClick}
        />
      );
    });

  return root ? (
    <ul>{children}</ul>
  ) : (
    <li className={style.listItem} onClick={onClick(item)}>
      {item?.name}
      <ul>{children}</ul>
    </li>
  );
};

const GET_TREE = gql`
  query RepoItems($owner: String!, $repo_name: String!, $oid: GitObjectID!) {
    repo: repository(name: $repo_name, owner: $owner) {
      id
      items: object(oid: $oid) {
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
export default Tree;
