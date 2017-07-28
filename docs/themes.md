# Blocks support by themes

By default, blocks provide their styles to enable basic support for blocks in themes without any change. Themes can add/override these styles, or they can provide no styles at all, and rely fully on what the theme provides.

Some advanced block features require opt-in support in the theme itself as it's difficult for the block to provide these styles, they may require some architecting of the theme itself, in order to work well.

## Opt-in features

### Wide Images:

Some blocks such as the image block have the possibility to define a "wide" or "full" alignment by adding the corresponding classname to the block's wrapper ( `alignwide` or `alignfull` ). A theme can opt-in for this feature by calling:

```php
add_theme_support( 'gutenberg', array(
   'wide-images' => true,
) );
```
