import {html} from './html.js';

const ICONS = {
  note: 'ℹ',
  info: 'ℹ',
  tip: '✦',
  important: '!',
  warning: '⚠',
  caution: '⚠',
  danger: '✖',
};

const DEFAULT_TITLES = {caution: 'warning'};

// :::tip Title ... ::: in Markdown becomes <Admonition type="tip" title="Title">.
export default function Admonition({type = 'note', title, children}) {
  const heading = title || DEFAULT_TITLES[type] || type;
  return html`
    <div className=${`admonition admonition-${type}`} role="note">
      <div className="admonition-heading">
        <span className="admonition-icon" aria-hidden="true">${ICONS[type] || 'ℹ'}</span>
        <span>${heading}</span>
      </div>
      <div className="admonition-content">${children}</div>
    </div>
  `;
}
