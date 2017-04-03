Coding Guidelines
=================

This living document serves to prescribe coding guidelines specific to the Gutenberg editor project. Base coding guidelines follow the [WordPress Coding Standards](https://codex.wordpress.org/WordPress_Coding_Standards). The following sections outline additional patterns and conventions used in the Gutenberg project.

## CSS

### Naming

To avoid class name collisions between elements of the editor and to the enclosing WordPress dashboard, class names **must** adhere to the following guidelines:

Any default export of a folder's `index.js` **must** be prefixed with `editor-` followed by the directory name in which it resides:

>.editor-_[ directory name ]_

(Example: `.editor-inserter` from `inserter/index.js`)

For any descendant of the top-level (`index.js`) element, prefix using the top-level element's class name separated by two underscores:

>.editor-_[ directory name ]_\_\__[ descendant description ]_

(Example: `.editor-inserter__button-toggle` from `inserter/button.js`)

For optional variations of an element or its descendants, you may use a modifier class, but you **must not** apply styles to the modifier class directly; only as an additional selector to the element to which the modifier applies:

>.editor-_[ directory name ]_.is-_[ modifier description ]_
>.editor-_[ directory name ]_\_\__[ descendant description ]_.is-_[ modifier description ]_

(Example: `.editor-inserter__button-toggle.is-active` )

In all of the above cases, except in separating the top-level element from its descendants, you **must** use dash delimiters when expressing multiple terms of a name.

You may observe that these conventions adhere closely to the [BEM (Blocks, Elements, Modifiers)](http://getbem.com/introduction/) CSS methodology, with minor adjustments to the application of modifiers.
