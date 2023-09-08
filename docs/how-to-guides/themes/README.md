# Themes

The block editor provides a number of options for theme designers and developers, to interact with it, including theme-defined color settings, font size control, and much more.

## Types of themes

See the <a href="https://developer.wordpress.org/themes/">Themes Handbook</a> for more information on the different ways you can build a theme in WordPress.

### Classic theme

In terms of block editor terminology this is any theme that defines its templates in the traditional `.php` file format, and that doesn't have an `index.html` format template in the `/block-templates` or `/templates` folders. A Classic theme has the ability to provide configuration and styling options to the block editor, and block content, via [Theme Supports](/docs/how-to-guides/themes/theme-support.md), or by including a [theme.json](/docs/how-to-guides/themes/theme-json.md) file. A theme does not have to be a Block theme in order to take advantage of some of the flexibility provided by the use of a `theme.json` file.

### Block theme

This is any theme that has, at a minimum, an `index.html` format template in the `/block-templates` or `/templates` folders, and with templates  provided in form of block content markup. While many Block themes will make use of a `theme.json` file to provide configuration and styling settings, a `theme.json` is not a requirement of Block themes. The advantage of Block themes is that the block editor can be used to edit all areas of the site: headers, footers, sidebars, etc.

