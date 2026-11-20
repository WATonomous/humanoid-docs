import {html} from './html.js';

// :::gallery ... ::: in Markdown. Lays out the images/videos inside as a grid.
//   :::gallery          as many ~280px columns as fit
//   :::gallery 2        two equal columns
//   :::gallery 1fr 2fr  any CSS grid-template-columns value
export default function Gallery({cols, children}) {
  const template = !cols ? undefined : /^\d+$/.test(cols) ? `repeat(${cols}, minmax(0, 1fr))` : cols;
  return html`<div className="gallery" style=${template ? {'--gallery-cols': template} : undefined}>${children}</div>`;
}
