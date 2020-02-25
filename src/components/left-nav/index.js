import { h, Component } from "preact";

import style from "./style.css";

export default class LeftNav extends Component {
  componentDidMount() {}

  componentWillUnmount() {}

  render({ files, onItemClick }) {
    return (
      <ul>
        {files.map(f => (
          <li className={style.listItem} onClick={() => onItemClick(f)}>
            {f.name}
          </li>
        ))}
      </ul>
    );
  }
}
