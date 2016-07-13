# stylelint-config-wordpress
[![NPM version](http://img.shields.io/npm/v/stylelint-config-wordpress.svg)](https://www.npmjs.org/package/stylelint-config-wordpress) [![Build Status](https://api.travis-ci.org/ntwb/stylelint-config-wordpress.svg?branch=master)](https://travis-ci.org/ntwb/stylelint-config-wordpress) [![Build status](https://ci.appveyor.com/api/projects/status/e5bv7cgn83ci69lo?svg=true)](https://ci.appveyor.com/project/ntwb/stylelint-config-wordpress)

> WordPress shareable config for stylelint.

Configuration rules to ensure your CSS is compliant with the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Extending the config](#extending-the-config)
- [Style Guide](#style-guide)
  - [Structure](#structure)
  - [Selectors](#selectors)
  - [Properties](#properties)
  - [Property Ordering](#property-ordering)
  - [Vendor Prefixes](#vendor-prefixes)
  - [Values](#values)
  - [Media Queries](#media-queries)
  - [Commenting](#commenting)
  - [Best Practices](#best-practices)
- [Changelog](#changelog)
- [License](#license)

## Installation

```console
$ npm install stylelint-config-wordpress
```

## Usage

If you've installed `stylelint-config-wordpress` locally within your project, just set your `stylelint` config to:

```json
{
  "extends": "stylelint-config-wordpress"
}
```

If you've globally installed `stylelint-config-wordpress` using the `-g` flag, then you'll need to use the absolute path to `stylelint-config-wordpress` in your config:

```json
{
  "extends": "/absolute/path/to/stylelint-config-wordpress"
}
```

## Extending the config

Simply add a `"rules"` key to your config and add your overrides there.

For example, to change the `indentation` to four spaces and turn off the `number-leading-zero` rule:


```json
{
  "extends": "stylelint-config-wordpress",
  "rules": {
    "indentation": 4,
    "number-leading-zero": null
  }
}
```

## Style Guide

### Structure - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#structure) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/structure.js)

There are plenty of different methods for structuring a stylesheet. With the CSS in core, it is important to retain a high degree of legibility. This enables subsequent contributors to have a clear understanding of the flow of the document.

- Use tabs, not spaces, to indent each property.
- Add two blank lines between sections and one blank line between blocks in a section.
- Each selector should be on its own line, ending in either a comma or an opening curly brace. Property-value pairs should be on their own line, with one tab of indentation and an ending semicolon. The closing brace should be flush left, using the same level of indentation as the opening selector.

Correct:
```css
#selector-1,
#selector-2,
#selector-3 {
  background: #fff;
  color: #000;
}

#selector-4 {
  background: #fff;
  color: #000;
}
```
Incorrect:
```css
#selector-1, #selector-2, #selector-3 {
    background: #fff;
    color: #000;
    }


#selector-1 { background: #fff; color: #000; }
```

### Selectors - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#selectors) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/selectors.js)

With specificity, comes great responsibility. Broad selectors allow us to be efficient, yet can have adverse consequences if not tested. Location-specific selectors can save us time, but will quickly lead to a cluttered stylesheet. Exercise your best judgement to create selectors that find the right balance between contributing to the overall style and layout of the DOM.

- Similar to the WordPress Coding Standards for file names, use lowercase and separate words with hyphens when naming selectors. Avoid camelcase and underscores.
- Use human readable selectors that describe what element(s) they style.
- Attribute selectors should use double quotes around values
- Refrain from using over-qualified selectors, `div.container` can simply be stated as `.container`

Correct:
```css
#comment-form {
    margin: 1em 0;
}
 
input[type="text"] {
    line-height: 1.1;
}
```
Incorrect:
```css
#commentForm { /* Avoid camelcase. */
    margin: 0;
}
 
#comment_form { /* Avoid underscores. */
    margin: 0;
}
 
div#comment_form { /* Avoid over-qualification. */
    margin: 0;
}
 
#c1-xr { /* What is a c1-xr?! Use a better name. */
    margin: 0;
}
 
input[type=text] { /* Should be [type="text"] */
    line-height: 110% /* Also doubly incorrect */
}
```

### Properties - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#properties) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/properties.js)

Similar to selectors, properties that are too specific will hinder the flexibility of the design. Less is more. Make sure you are not repeating styling or introducing fixed dimensions (when a fluid solution is more acceptable).

- Properties should be followed by a colon and a space.
- All properties and values should be lowercase, except for font names and vendor-specific properties.
- Use hex code for colors, or rgba() if opacity is needed. Avoid RGB format and uppercase, and shorten values when possible: `#fff` instead of `#FFFFFF`.
- Use shorthand (except when overriding styles) for background, border, font, list-style, margin, and padding values as much as possible. (For a shorthand reference, see [CSS Shorthand](https://codex.wordpress.org/CSS_Shorthand).)

Correct:
```css
#selector-1 {
  background: #fff;
  margin: 0;
  margin-left: 20px;
}
```
Incorrect:
```css
#selector-1 {
  background:#FFFFFF;
  margin-left: 20PX;
  margin: 0;

}
```

### Property Ordering - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#property-ordering) / ToDo

> “Group like properties together, especially if you have a lot of them.”
> — Nacin

Above all else, choose something that is meaningful to you and semantic in some way. Random ordering is chaos, not poetry. In WordPress Core, our choice is logical or grouped ordering, wherein properties are grouped by meaning and ordered specifically within those groups. The properties within groups are also strategically ordered to create transitions between sections, such as background directly before color. The baseline for ordering is:

- Display
- Positioning
- Box model
- Colors and Typography
- Other

Things that are not yet used in core itself, such as CSS3 animations, may not have a prescribed place above but likely would fit into one of the above in a logical manner. Just as CSS is evolving, so our standards will evolve with it.

Top/Right/Bottom/Left (TRBL/trouble) should be the order for any relevant properties (e.g. margin), much as the order goes in values. Corner specifiers (e.g. border-radius-*-*) should be top-left, top-right, bottom-right, bottom-left. This is derived from how shorthand values would be ordered.

Example:
```css
#overlay {
    position: absolute;
    z-index: 1;
    padding: 10px;
    background: #fff;
    color: #777;
}
```

Another method that is often used, including by the Automattic/WordPress.com Themes Team, is to order properties alphabetically, with or without certain exceptions.

Example:
```css
#overlay {
    background: #fff;
    color: #777;
    padding: 10px;
    position: absolute;
    z-index: 1;
}
```

### Vendor Prefixes - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#vendor-prefixes) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/vendor-prefixes.js)

Updated on 2/13/2014, after [27174](https://core.trac.wordpress.org/changeset/27174):

We use [Autoprefixer](https://github.com/nDmitry/grunt-autoprefixer) as a pre-commit tool to easily manage necessary browser prefixes, thus making the majority of this section moot. For those interested in following that output without using Grunt, vendor prefixes should go longest (-webkit-) to shortest (unprefixed). All other spacing remains as per the rest of standards.

```css
.sample-output {
    -webkit-box-shadow: inset 0 0 1px 1px #eee;
    -moz-box-shadow: inset 0 0 1px 1px #eee;
    box-shadow: inset 0 0 1px 1px #eee;
}
```

### Values - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#values) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/values.js)

There are numerous ways to input values for properties. Follow the guidelines below to help us retain a high degree of consistency.

- Space before the value, after the colon
- Do not pad parentheses with spaces
- Always end in a semicolon
- Use double quotes rather than single quotes, and only when needed, such as when a font name has a space.
- Font weights should be defined using numeric values (e.g. `400` instead of `normal`, `700` rather than `bold`).
- 0 values should not have units unless necessary, such as with transition-duration.
- Line height should also be unit-less, unless necessary to be defined as a specific pixel value. This is more than just a style convention, but is worth mentioning here. More information: http://meyerweb.com/eric/thoughts/2006/02/08/unitless-line-heights/
- Use a leading zero for decimal values, including in rgba().
- Multiple comma-separated values for one property should be separated by either a space or a newline, including within rgba(). Newlines should be used for lengthier multi-part values such as those for shorthand properties like box-shadow and text-shadow. Each subsequent value after the first should then be on a new line, indented to the same level as the selector and then spaced over to left-align with the previous value.

Correct:
```css
.class { /* Correct usage of quotes */
    background-image: url(images/bg.png);
    font-family: "Helvetica Neue", sans-serif;
    font-weight: 700;
}
 
.class { /* Correct usage of zero values */
    font-family: Georgia, serif;
    text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.5),
                       0 1px 0 #fff;
}
```
Incorrect:
```css
.class { /* Avoid missing space and semicolon */
    background:#fff
}
 
.class { /* Avoid adding a unit on a zero value */
    margin: 0px 0px 20px 0px;
}

.class {
    font-family: Times New Roman, serif; /* Quote font names when required */
    font-weight: bold; /* Avoid named font weights */
}
```

### Media Queries - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#media-queries) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/media-queries.js)

Media queries allow us to gracefully degrade the DOM for different screen sizes. If you are adding any, be sure to test above and below the break-point you are targeting.

- It is generally advisable to keep media queries grouped by media at the bottom of the stylesheet.
  - An exception is made for the `wp-admin.css` file in core, as it is very large and each section essentially represents a stylesheet of its own. Media queries are therefore added at the bottom of sections as applicable.
- Rule sets for media queries should be indented one level in.

Correct:
```css
@media all and (max-width: 699px) and (min-width: 520px) {

  /* Your selectors */
}

@media screen and (color),
  projection and (color) {}
```
Incorrect:
```css
@media all and (max-width:699px) {

  /* Your selectors */
}

@media all and (max-width :699px) {

  /* Your selectors */
}

@media all and (max-width 699px) {

  /* Your selectors */
}

@media all and (max-width>=699px) {

  /* Your selectors */
}

@media all and (max-width >=699px) {

  /* Your selectors */
}

@media all and (max-width>= 699px) {

  /* Your selectors */
}

@media screen and (color), projection and (color) {}

@media screen and (color) ,
  projection and (color) {}
```

### Commenting - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#commenting) / [Tests](https://github.com/ntwb/stylelint-config-wordpress/blob/master/__tests__/commenting.js)

- Comment, and comment liberally. If there are concerns about file size, utilize minified files and the `SCRIPT_DEBUG` constant. Long comments should manually break the line length at 80 characters.
- A table of contents should be utilized for longer stylesheets, especially those that are highly sectioned. Using an index number (1.0, 1.1, 2.0, etc.) aids in searching and jumping to a location.
- Comments should be formatted much as PHPDoc is. The [CSSDoc](http://cssdoc.net/) standard is not necessarily widely accepted or used but some aspects of it may be adopted over time. Section/subsection headers should have newlines before and after. Inline comments should not have empty newlines separating the comment from the item to which it relates.

Correct:
```css
/**
* #.# Section title
*
* Description of section, whether or not it has media queries, etc.
*/

.selector {
  float: left;
}


/**
* #.# Another section title
*
* Description of section, whether or not it has media queries, long comments
* should manually break the line length at 80 characters.
*/

.selector {
  float: right;
}

/* This is a comment about this selector */
.another-selector {
  position: absolute;
  top: 0 !important; /* I should explain why this is so !important */
}

/* Long comments should manually break the line length at 80 characters. */
```
Incorrect:
```css
/**
* #.# Section title
*
* Description of section, whether or not it has media queries, etc.
*/
.selector {
  float: left;
}
/**
* #.# Another section title
*
* Description of section, whether or not it has media queries, long comments
* should manually break the line length at 80 characters.
*/
.selector {
  float: right;
}
/* This is a comment about this selector */
.another-selector {
  position: absolute;
  top: 0 !important; /* I should explain why this is so !important */
}

/* Comments shouldn't have a line length greater than 80 characters, they should manually break the line length at 80 characters */
```

### Best Practices - [Handbook](https://make.wordpress.org/core/handbook/best-practices/coding-standards/css/#best-practices)

Stylesheets tend to get long in length. Focus slowly gets lost whilst intended goals start repeating and overlapping. Writing smart code from the outset helps us retain the overview whilst remaining flexible throughout change.

- If you are attempting to fix an issue, attempt to remove code before adding more.
- Magic Numbers are unlucky. These are numbers that are used as quick fixes on a one-off basis. Example: `.box { margin-top: 37px }`.
- DOM will change over time, target the element you want to use as opposed to “finding it” through its parents. Example: Use `.highlight` on the element as opposed to `.highlight a` (where the selector is on the parent)
- Know when to use the height property. It should be used when you are including outside elements (such as images). Otherwise use line-height for more flexibility.
- Do not restate default property & value combinations (for instance `display: block;` on block-level elements).

## [Changelog](CHANGELOG.md)

## [License](LICENSE)
