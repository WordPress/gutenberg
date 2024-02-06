# Font Library

Font Library consists of a font manager that enables users to install, remove, and activate typographic fonts from various sources in WordPress.

The Font Library is available globally, independently of the theme activated, similar to the Media Library. This list of installed fonts and their assets are site-wide available, and the users can select the fonts activated (available in the editor) for each theme.

The font library consist of 3 main components that are combined to make it work: the UI, the PHP API and the REST API. These docs cover them in that order.

## Using the Font Library

The Font Library UI enables users to browse, install, uninstall, activate and de-activate fonts. 

### Browse installed fonts
The list of installed fonts features the fonts provided by the active theme (via `theme.json`) and the fonts installed using the font library.

### Install fonts
Install font is to make a font family available to the user in the font library. When a font is installed its definition is stored in the database and their filee assets (if any) are stored in the file system.The fonts can be installed from a font collection or by uploading font  file assets. Fonts installed using the font library are available system wide.

#### Install fonts from a font collection
To install a font from a font collection the user needs to browse the font collection tab, select the font family, then check all the variants desired, and, finally, tap 'Install' button. 

#### Install fonts by uploading files
To install a font by uploading font files, the user needs to navigate the 'Upload' tab of the font library modal and drag and drop or select the font files of the font family to install.

### Uninstall fonts
Uninstall a font family is removing a font family from the font library permanently. It means that the font definition is removed from the database, and the font assets, if any, are removed from the file-system.

### Activate and de-activate fonts
When a font family is activated, the font defintion is added to the [Global Styles](/packages/edit-site/src/components/global-styles). Font families listed in global styles are rendered to pages and become available in the font pickers, so they can be applied to any element using the editor.

When a font family is de-activated the font definition is removed from the global styles, so it won't be rendered on the frontend. The unactive fonts are still available on the font library and can be re-activated at any time. 

When 


## PHP API


### Font Collections
A font collection is a list of font family definitions ready to be installed by the user. The font family definition is a fontFamily item in `theme.json` like format. The font collections are presented to the users in the editor so one can choose whether to install a font family to their WordPress site.

The only responsibility of a font collection is to present a list of font families in a correct format. Font collections are not in charge of installing the fonts; they just list a group of font families so users can choose the one they want to install. If the font family includes font faces, those font faces should have links to bundled (e.g: in a plugin assets) or external (e.g: from a CDN) font assets that will be downloaded or linked when the font family is installed.

#### Register a font collection
Register a font collection means providing a user a new list of fonts from one can select and install fonts. When a font collection is registered it is featured as a new tab in the font library modal and it's fetcheable using the `/font-collections/` REST API endpoint.

To register a font collection you need to use `wp_register_font_collection` function.

##### Register a font collection using PHP only
Example:
```php
$font_families = [
    array(
        'font_family_settings' => (
            array (
                'fontFamily' => 'Piazzolla, serif',
                'slug'       => 'paizzolla',
                'name'       => 'Piazzolla',
                'fontFace'   => array (
                  array (
                    'fontFamily' => 'Piazzolla',
                    'fontWeight' => '400'
                    'fontStyle'  => 'normal'
                    'src'        => path_join( plugin_dir_path( __FILE__ ), "fonts/piazzolla400normal.woff2" )
                  )
                )
            )
        ),
        'categories' => [ 'system-ui' ],
    ),
    array(
        'font_family_settings' => (
            array (
                'fontFamily' => 'Arial, Helvetica, Tahoma, Geneva, sans-serif',
                'slug'       => 'arial',
                'name'       => 'Arial',
            )
        ),
        'categories' => [ 'sans-serif' ],
    ),
];

$categories = [
    array(
        'slug' => 'serif',
        'name' => 'Serif',
    ),
    array(
        'slug' => 'sans-serif',
        'name' => 'Sans Serif',
    ),
];

$config = array (
    'name'          => 'My sytem fonts collection',
    'description'   => 'Stacks of modern systems fonts, not font face assets needed. The look will vary on each system.',
    'font_families' => $font_families,
    'categories'    => $categories,
);

function register_my_collection(){
    wp_register_font_collection ( 'my-font-foundry', $config );
}

add_action( 'init', 'register_my_collection' );
```

##### Register a font collection using a JSON file

Example using a local JSON file:
```php
function register_my_collection(){
    wp_register_font_collection ( 'my-font-foundry', path_join( __DIR__, 'my-collection.json' ) );
}

add_action( 'init', 'register_my_collection' );
```

Example using a JSON from an URL:
```php
function register_my_collection(){
    wp_register_font_collection ( 'my-font-foundry', 'https://example.com/fonts/my-collection.json' );
}

add_action( 'init', 
```

`my-collection.json` file example:

```json
{
  "$schema": "https://schemas.wp.org/trunk/font-collection.json",
  "name": "My Font Foundry Collection",
  "decription": "The font offered by My Font Foundry",
  "categories": [
    { "id": "sans-serif", "name": "Sans Serif" },
    { "id": "serif", "name": "Serif" },
  ],
  "font_families": [
    {
      "font_family_settings": {
        "name": "Aboreto",
        "fontFamily": "Aboreto, system-ui",
        "slug": "aboreto",
        "fontFace": [
          {
            "src": "https://fonts.gstatic.com/s/aboreto/v2/5DCXAKLhwDDQ4N8blKHeA2yuxSY.woff2",
            "fontWeight": "400",
            "fontStyle": "normal",
            "fontFamily": "Aboreto",
            "preview": "https://s.w.org/images/fonts/17.6/previews/aboreto/aboreto-400-normal.svg"
          }
        ],
        "preview": "https://s.w.org/images/fonts/17.6/previews/aboreto/aboreto.svg"
      },
      "categories": ["sans-serif"]
    },
    {
      "font_family_settings": {
        "name": "Abril Fatface",
        "fontFamily": "Abril Fatface, system-ui",
        "slug": "abril-fatface",
        "fontFace": [
          {
            "src": "https://fonts.gstatic.com/s/abrilfatface/v23/zOL64pLDlL1D99S8g8PtiKchm-VsjOLhZBY.woff2",
            "fontWeight": "400",
            "fontStyle": "normal",
            "fontFamily": "Abril Fatface",
            "preview": "https://s.w.org/images/fonts/17.6/previews/abril-fatface/abril-fatface-400-normal.svg"
          }
        ],
        "preview": "https://s.w.org/images/fonts/17.6/previews/abril-fatface/abril-fatface.svg"
      },
      "categories": ["serif"]
    },
  ]
}
```

#### Unregister a font collection
To unregister a font collection you need to add an action calling `wp_unregister_font_collection` with the font collection slug as the only parameter. The unregistered font collections won't appear as a font library modal tab and it won't be listed on the `/font-collections/` REST API endpoint.

Example:
```php
function unregister_google_fonts(){
    wp_unregister_font_collection ( 'google-fonts' );
}
add_action( 'init', 'unregister_google_fonts' );
```

### Assets storage

**TODO:** add the `font_dir` docs.



## Rest API

### Different types of installations

The library allows extenders to define how WordPress installs fonts. When users install a font family, its definition will always be saved to the database. What can vary is where the font face file assets are stored.

Review the following different types of installations to find what works best for your use case:
#### Install a system font ( a font with no font file assets)
When you want to install a font family that doesn't need any font assets to work, these fonts are usually called system fonts. You can define these font families like this:
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

