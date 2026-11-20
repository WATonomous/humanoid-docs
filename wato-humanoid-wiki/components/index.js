// Components usable from any Markdown page without an import, e.g. <ArmJointNaming />.
// Write components with `html` (htm tagged templates, JSX-like, no build step).
// A component's styles go in a .css file next to it; every components/*.css file is
// bundled into the site stylesheet.

import Admonition from './Admonition.js';
import ArmJointNaming from './ArmJointNaming.js';

export default {Admonition, ArmJointNaming};
