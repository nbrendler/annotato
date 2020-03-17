import { h } from "preact";
import Match from "preact-router/match";
import { route } from "preact-router";
import netlify from "netlify-auth-providers";

const GithubButton = () => {
  const onClick = path => () => {
    const authenticator = new netlify({
      site_id: "11c1e4d4-5928-457e-a3c4-9118a510f247"
    });
    authenticator.authenticate(
      { provider: "github", scope: "" },
      (err, data) => {
        if (err) {
          console.error(err);
        }

        localStorage.setItem("token", data.token);
        route(path, true);
      }
    );
  };
  return (
    <Match path="/">
      {({ path }) => {
        return (
          <a
            onClick={onClick(path)}
            className="cursor-default bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Sign in with GitHub
          </a>
        );
      }}
    </Match>
  );
};

export default GithubButton;
