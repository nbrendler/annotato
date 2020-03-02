import { h } from "preact";
import { useState, useCallback, useContext } from "preact/hooks";

import { GithubContext } from "../gh-context";
import styles from "./styles";

const getItems = entries => {
  return entries && entries.map && entries.map(i => <TreeNode item={i} />);
};

const TreeNode = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const { fetchSubtree, fetchContent, data } = useContext(GithubContext);
  const nodeData = data[item.oid];
  const onClick = useCallback(
    e => {
      e.stopPropagation();
      if (item.type === "tree") {
        if (expanded) {
          setExpanded(false);
        } else {
          setExpanded(true);
          fetchSubtree(item);
        }
      } else {
        fetchContent(item);
      }
    },
    [item, fetchSubtree, fetchContent, expanded, setExpanded]
  );
  // TODO: have to consider the whole path, names will conflict
  const highlighted = data.name === item.name ? "bg-blue-200" : "";

  // TODO: Maybe this should be split into smaller components, the classes are
  // getting wild
  return (
    <div className="flex" onClick={onClick}>
      <div
        className={`mt-2 ${item.type === "tree" ? styles.expandable : ""} ${
          expanded ? styles.expanded : ""
        }`}
      />
      <li className={`${highlighted} pl-1 select-none`}>
        {item?.name}
        <ul className={expanded ? "" : "hidden"}>{getItems(nodeData)}</ul>
      </li>
    </div>
  );
};

export const TreeRoot = () => {
  const {
    data: { root }
  } = useContext(GithubContext);

  return <ul>{getItems(root)}</ul>;
};

export default TreeRoot;
