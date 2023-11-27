## Font Library

Font Library consists of a font manager that enables users to install, remove, and activate typographic fonts from various sources in WordPress.

The Font Library is available globally, independently of the theme activated, similar to the Media Library. This list of installed fonts and their assets are site-wide available, and the users can select the fonts activated (available in the editor) for each theme.

### Glossary

- **Font family**: Is a typographic family that may include different variants. Typical examples are `Arial`, `Helvetica`, `Inter`.
- **Font face**: Is a typographic variant of a font family. Each font family may include one or more font faces. Each font face has some unique characteristics as font weight (light, regular, bold, etc.) and font style (italic, normal, etc.). Typical examples are `Helvetica bold italic`, `Inter light normal`.
- **Install font family**: Is to make a font family available to the user in the Font Library. The user will be able to activate and use the installed font families.
- **Activate font family**: Is to make it ready to use in the site or post editor. All the active fonts will appear in the font pickers so the user can use them in the site elements.
- **Deactivate font family**: Is to make a font family unusable. If a font family is not active, it won't appear in the font pickers.
- **Uninstall font family**: Is to remove the font family from the Font Library permanently.

### Different types of installations

The library allows extenders to define how WordPress will install fonts. When users install a font family, its definition will always be saved to the database. What can vary is where are the font face file assets stored.

Review the following different types of installations to find what works best for your use case:
#### Install a font with no font file assets (system fonts)
In a situation where you want to install a font family that doesn't need any font assets to work, these fonts are usually called system fonts. You can define these font families like this:
```json
{
    "name": "Humanist",
    "slug": "humanist",
    "fontFamily": "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif",

}
```

#### Install a font with external assets
In a situation where you want to install a font family that needs to add font faces using external font file assets, you can define font families like this:
```json
{
    "name": "Piazzolla",
    "slug": "piazzolla",
    "fontFamily": "Piazzolla, serif",
    "fontFace": [
        {
          "src": "http://fonts.gstatic.com/s/piazzolla/v33/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7LYxnLy1AHfAAy5.ttf",
          "fontWeight": "400",
          "fontStyle": "normal",
          "fontFamily": "Piazzolla"
        },
    ]
}
```

Font Face assets will be served from the external URL provided in the `src` attribute.

####  Install a font from external sources and serve it from your site
In order to install a font family that uses assets located outside of your site and download it while installing, to serve them from your WordPress `/wp-content/fonts` folder. Useful, for example, if you want to avoid depending on external sites for technical or legal reasons. It can be achieved by settings the `downloadFromUrl` property on each font face to the URL of the font.

```json
{
    "name": "Piazzolla",
    "slug": "piazzolla",
    "fontFamily": "Piazzolla, serif",
    "fontFace": [
        {
          "downloadFromUrl": "http://fonts.gstatic.com/s/piazzolla/v33/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7LYxnLy1AHfAAy5.ttf",
          "fontWeight": "400",
          "fontStyle": "normal",
          "fontFamily": "Piazzolla"
        },
    ]
}
```

#### Install a font providing the font asset
In a situation where you want to install a font family using the font files you are providing in an HTTP request. These font file assets will be stored in your WordPress `/wp-content/fonts` folder and they will always be served from your site. This can be useful, for example, if you want to avoid depending on external sites for technical or legal reasons. You need to add the file to your HTTP request and add a reference for it in the font face definition.

```json
{
    "name": "Piazzolla",
    "slug": "piazzolla",
    "fontFamily": "Piazzolla, serif",
    "fontFace": [
        {
          "uploadedFile": "request-file-id",
          "fontWeight": "400",
          "fontStyle": "normal",
          "fontFamily": "Piazzolla"
        },
    ]
}
```

### Extensibility
Font Library is able to manage different font collections. A font collection is simply a list of font families ready to be installed by the user. Extenders can provide multiple typographic collections.

#### Provide a font collection

To provide a font collection you need to call `wp_register_font_collection()` function with your configuration as a parameter. Any font collection you provide will be available as a new tab in the Font Library modal.

Adding a font collection example:

```php
$my_config = array (
    'id'             => 'my-font-collection',
    'name'           => 'My Font Collection',
    'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
    'data_json_file' => path_join( __DIR__, 'my-font-collection-data.json' ),
);

if ( function_exists( 'wp_register_font_collection' ) ) {
    wp_register_font_collection ( $my_config );
}
```

The Data JSON file for the collection created should look like this:
```json
{
    "fontFamilies": [
        ...
    ],
    "categories": [
        ...
    ]
}
```

Example of a data JSON file providing 2 font families, with 2 font faces each and 2 categories:

```json
{
  "fontFamilies": [
    {
      "name": "Montserrat",
      "fontFamily": "Montserrat, sans-serif",
      "slug": "montserrat",
      "category": "sans-serif",
      "fontFace": [
        {
          "src": "http://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-Y3tcoqK5.ttf",
          "fontWeight": "400",
          "fontStyle": "normal",
          "fontFamily": "Montserrat"
        },
        {
          "src": "http://fonts.gstatic.com/s/montserrat/v25/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9aX9-p7K5ILg.ttf",
          "fontWeight": "400",
          "fontStyle": "italic",
          "fontFamily": "Montserrat"
        },
      ]
    },
    {
      "name": "Piazzolla",
      "fontFamily": "Piazzolla, serif",
      "slug": "piazzolla",
      "category": "serif",
      "fontFace": [
        {
          "src": "http://fonts.gstatic.com/s/piazzolla/v33/N0b52SlTPu5rIkWIZjVKKtYtfxYqZ4RJBFzFfYUjkSDdlqZgy7LYxnLy1AHfAAy5.ttf",
          "fontWeight": "400",
          "fontStyle": "normal",
          "fontFamily": "Piazzolla"
        },
        {
          "src": "http://fonts.gstatic.com/s/piazzolla/v33/N0b72SlTPu5rIkWIZjVgI-TckS03oGpPETyEJ88Rbvi0_TzOzKcQhZqx3gX9BRy5m5M.ttf",
          "fontWeight": "400",
          "fontStyle": "italic",
          "fontFamily": "Piazzolla"
        },
      ]
    }
  ],
  "categories": [
    "sans-serif",
    "serif"
  ]
}
```

### Create a plugin to provide a font collection

Here's an example of a plugin that provides a font collection:
```php

<?php
/*
Plugin Name: My Font Collection
Plugin URI: https://your-website.com/
Description: Add a font collection to your WordPress Font Library.
Version: 1.0
Author: Your Name
Author URI: https://your-website.com/
License: GPLv2 or later
Text Domain: my-font-collection
*/

$my_config = array (
    'id'             => 'my-font-collection',
    'name'           => 'My Font Collection',
    'description'    => 'Demo about how to a font collection to your WordPress Font Library.',
    'data_json_file' => path_join( __DIR__, 'my-font-collection-data.json' ),
);

if ( function_exists( 'wp_register_font_collection' ) ) {
    wp_register_font_collection ( $my_config );
}

?>

```

### API endpoints

#### Install font families
Install a font family is to save a font definition in WordPress and make it available to be activated and used by the user.

Save a font family may or may not include storing the font files assets localy to disk in `/wp-content/fonts` folder. That depends on how the font family sent to this endpoint is defined.

```
POST /wp-json/wp/v2/fonts
```

Example:

#### Uninstall font families
Uninstalling a font family removes the font definition from WordPress and makes it unavailable for users to activate and save.

If the font family being uninstalled is using local font file assets, those files will be removed from the `/wp-content/fonts` folder.

```
DELETE /wp-json/wp/v2/fonts
```

Example:

#### Get font collections
Gets the list of fonts collections available.

```
GET /wp-json/wp/v2/fonts/collections
```

Example:

#### Get a font collection
Get a particular font collection and its data.
```
GET /wp-json/wp/v2/fonts/collections/<id>
```

Example:

