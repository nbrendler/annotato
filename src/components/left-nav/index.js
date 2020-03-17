import { h } from "preact";
import { useState, useCallback, useContext, useEffect } from "preact/hooks";

import { GithubContext } from "../gh-context";
import Loading from "../loading";
import styles from "./styles";

const getItems = (entries, path) => {
  return (
    entries &&
    entries.map &&
    entries.map(i => <TreeNode item={i} path={path.concat([i.name])} />)
  );
};

const TreeNode = ({ item, path }) => {
  // There's probably way to use loading state given by useLazyQuery instead of
  // this, but this works
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { getData, data } = useContext(GithubContext);
  const nodeData = data[item.oid];

  // If there's data on the first render, expand the tree (for deep links)
  useEffect(() => {
    if (nodeData) {
      setExpanded(true);
      setLoading(false);
    }
  }, [nodeData]);

  const onClick = useCallback(
    e => {
      e.stopPropagation();
      if (item.type === "tree") {
        if (expanded) {
          setExpanded(false);
        } else {
          setExpanded(true);
          if (!nodeData) {
            setLoading(true);
            getData(item, path);
          }
        }
      } else {
        getData(item, path);
      }
    },
    [item, getData, path, expanded, setExpanded]
  );

  const highlighted = data.oid === item.oid ? "bg-blue-200" : "";

  // TODO: Maybe this should be split into smaller components, the classes are
  // getting wild
  return (
    <div
      className={`${highlighted} flex px-4 py-1 hover:text-blue-600 cursor-pointer`}
      onClick={onClick}
    >
      <div
        className={`mt-2 ${item.type === "tree" ? styles.expandable : ""} ${
          expanded ? styles.expanded : ""
        }`}
      />
      <li className="pl-1 select-none">
        <span className={highlighted}>{item?.name}</span>
        {loading ? (
          <Loading type="tree node" />
        ) : (
          <ul className={expanded ? "" : "hidden"}>
            {getItems(nodeData, path)}
          </ul>
        )}
      </li>
    </div>
  );
};

export const TreeRoot = () => {
  const {
    data: { root },
    rootLoading
  } = useContext(GithubContext);

  if (rootLoading) {
    return <Loading type="tree" />;
  }

  return <ul className="border-r text-gray-700">{getItems(root, [])}</ul>;
};

export default TreeRoot;
