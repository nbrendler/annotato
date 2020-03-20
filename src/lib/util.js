export const [enableFailureInjection, createFailureInjection] = (function() {
  let inject = [];
  const _enable = injectionName => {
    inject.push(injectionName);
  };
  const _create = (injectionName, callback) => {
    if (
      process.env.NODE_ENV === "development" &&
      inject.indexOf(injectionName) > -1
    ) {
      callback();
    }
  };
  return [_enable, _create];
})();

export const getPathFragments = path => {
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
