## Disable functionality

This page is dedicated to the many ways you can disable specific functionality in the Post Editor and Site Editor that are not covered in other areas of the documentation. 

## Disable access to the template editor

Whether you’re using [theme.json in a Classic Theme](https://developer.wordpress.org/themes/block-themes/converting-a-classic-theme-to-a-block-theme/#adding-theme-json-in-classic-themes) or Block Theme, you can add the following to your functions.php file to remove access to the Template Editor that is available when editing posts or pages:

`remove_theme_support( 'block-templates');`

This prevents both the ability to create new block templates or edit them from within the Post Editor. 

## Disable access to the Code Editor

The Code Editor allows you to view the markup

## Restrict block options

There might be times when you don’t want access to a block at all to be available for users. To control what’s available in the inserter, you can take two approaches: [an allow list](/docs/reference-guides/filters/block-filters.md#using-an-allow-list) that disables all blocks except those on the list or a [deny list that unregisters specific blocks](/docs/reference-guides/filters/block-filters.md#using-a-deny-list). 

## Disable the Pattern Directory

To fully remove patterns bundled with WordPress core from being accessed in the Inserter, the following can be added to your functions.php file: 

`remove_theme_support( 'core-block-patterns' );`

## Disable block variations

## Disable block styles

