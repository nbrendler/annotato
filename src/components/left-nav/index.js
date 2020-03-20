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
  const { getData, data, treeError, path: currentPath } = useContext(
    GithubContext
  );
  const nodeData = data[item.oid];
  const hasError = treeError && !nodeData;

  // If there's data on the first render, expand the tree (for deep links)
  useEffect(() => {
    if (nodeData) {
      setExpanded(true);
      setLoading(false);
    }
  }, [nodeData]);

  if (hasError) {
    setLoading(false);
    setExpanded(false);
  }

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
    [item, getData, path, expanded, setExpanded, nodeData]
  );

  const loaded = data.oid === item.oid ? "bg-blue-200" : "";
  const focused = currentPath === path.join("/");

  if (focused && !loaded) {
    setLoading(true);
  } else if (loading && loaded) {
    setLoading(false);
  }

  return (
    <div
      className={`${loaded} flex px-4 py-1 transition ease-in-out duration-400 cursor-pointer`}
      onClick={onClick}
    >
      <div
        className={`mt-2 ${item.type === "tree" ? styles.expandable : ""} ${
          expanded ? styles.expanded : ""
        }`}
      />
      <li className="pl-1 select-none">
        {loading ? (
          <span className={`${loaded} hover:text-blue-600 flex justify-center`}>
            {(item && item.name) || null}
            <Loading type="tree node" />
          </span>
        ) : (
          <span>
            <span className={`${loaded} hover:text-blue-600`}>
              {(item && item.name) || null}
            </span>
            <ul className={expanded ? "" : "hidden"}>
              {getItems(nodeData, path)}
            </ul>
          </span>
        )}
      </li>
    </div>
  );
};

export const TreeRoot = () => {
  const {
    data: { root },
    rootLoading,
    error
  } = useContext(GithubContext);

  if (rootLoading) {
    return <Loading type="tree" />;
  }

  if (error && error.type === "root") {
    return null;
  }

  return <ul className="border-r text-gray-700">{getItems(root, [])}</ul>;
};

export default TreeRoot;
