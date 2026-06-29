import os
import sys

project = 'WATonomous Humanoid'
copyright = '2024, WATonomous | University of Waterloo'
author = 'WATonomous'

extensions = [
    'myst_parser',
    'sphinx.ext.mathjax',
    'sphinx_copybutton',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store', 'index.md']

html_theme = 'sphinx_rtd_theme'
html_static_path = ['assets']
html_show_sphinx = False
html_css_files = ['stylesheets/rtd-custom.css']
html_js_files = ['javascripts/strip-footer.js']

html_context = {
    "display_github": True,
    "github_user": "WATonomous",
    "github_repo": "humanoid-docs",
    "github_version": "main",
    "conf_py_path": "/docs/",
}

myst_enable_extensions = [
    "colon_fence",
    "dollarmath",
    "amsmath",
]
