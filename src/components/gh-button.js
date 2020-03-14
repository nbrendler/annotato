import { h } from "preact";
import Match from "preact-router/match";
import netlify from "netlify-auth-providers";

const GithubButton = () => {
  const onClick = () => {
    const authenticator = new netlify.default({});
    authenticator.authenticate(
      { provider: "github", scope: "user" },
      (err, data) => {
        if (err) {
          console.error(err);
        }

        localStorage.setItem("token", data.token);
      }
    );
  };
  return (
    <Match path="/">
      {({ path }) => {
        return (
          <a
            onClick={e => onClick(path)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign in with GitHub
          </a>
        );
      }}
    </Match>
  );
};

export default GithubButton;
