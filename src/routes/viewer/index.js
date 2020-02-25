import { h, Component } from "preact";
import { gql, useQuery } from "@apollo/client";

import style from "./style.css";
import LeftNav from "../../components/left-nav";
import Content from "../../components/content";

export default class Viewer extends Component {
  state = {
    current_oid: null
  };

  componentDidMount() {
    this.setOid = this.setOid.bind(this);
  }

  componentWillUnmount() {}

  setDefaultOid(repo) {
    let readme_oids = repo.files.filter(f => f.name in ["README", "README.md"]);
    if (readme_oids.length > 0) {
      this.setState({ current_oid: readme_oids[0].oid });
    }
  }

  setOid(f) {
    this.setState({ current_oid: f.oid });
  }

  render({ owner, repo_name, path }, { current_oid }) {
    const { loading, error, data } = useQuery(fileQuery, {
      variables: { owner, repo_name, current_oid, exp: `master:${path}` }
    });

    if (loading) {
      return <span>loading!</span>;
    }
    if (error) {
      return <span>{error}</span>;
    }
    if (current_oid === null) {
      //this.setDefaultOid(repository);
    }
    return (
      <div class={style.viewer}>
        <LeftNav
          files={data.repository.files.entries}
          onItemClick={this.setOid}
        />
        {data.repository.content ? (
          <Content text={data.repository.content.text} />
        ) : null}
      </div>
    );
  }
}

const fileQuery = gql`
  query RepoFiles(
    $owner: String!
    $repo_name: String!
    $oid: GitObjectID
    $current_oid: GitObjectID
    $exp: String = "master:"
  ) {
    repository(name: $repo_name, owner: $owner) {
      files: object(expression: $exp, oid: $oid) {
        ... on Tree {
          entries {
            name
            oid
            type
          }
        }
      }
      content: object(oid: $current_oid) {
        ... on Blob {
          text
        }
      }
    }
  }
`;
