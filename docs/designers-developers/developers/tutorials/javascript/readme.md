
# Getting Started with JavaScript

The purpose of this tutorial is to step through getting started with JavaScript and WordPress. The Gutenberg documentation contains information on the APIs available, but as a reference and not necessarily full working examples. The goal of this tutorial is get you comfortable on how to use these snippets of code.


## Plugins Background

The primary means of extending WordPress remains the plugin, see [Plugin Basics](https://developer.wordpress.org/plugins/the-basics/) for more. The quick start is create a new directory in `wp-content/plugins/` to hold your plugin code, call it `myguten-plugin`.

Inside of this new directory, create a file called `myguten-plugin.php` which will be the server-side code the runs when your plugin is active. For now you can place the following in that file:

```php
<?php
/*
Plugin Name: My Guten Plugin
*/
```

So you should have a directory `wp-content/plugins/myguten-plugin/` which has the single file `myguten-plugin.php`. Once that is in place, you can go to your plugins list in `wp-admin` and you should see your plugin listed.

Click **Activate** and your plugin will load with WordPress.


## Loading JavaScript

Now with the plugin in place, we can add our code that loads the JavaScript we want to use. This follows the standard WordPress methodology of enqueuing your scripts, see [Including CSS & JavaScript](https://developer.wordpress.org/themes/basics/including-css-javascript/) for more details.

Add the following code to your `myguten-plugin.php` file:

```php
function myguten_enqueue() {
	wp_enqueue_script( 'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks', 'wp-element' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

Create a file called `myguten.js` and add:

```js
console.log( "I'm loaded!" );
```

Now start a new post in the block editor, and check your browser Developer Tools. You should see the message in your console log. See [Mozilla's What are browser developer tools?](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) if you need more information, the area to become most familiar with is [The JavaScript console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console).

The script enqueuing uses the `enqueue_block_editor_assets` hook which only loads the JavaScript when the block editor loads. So if you navigate to any front-end page or article on your site, you will not see the message.

**Note:** The last argument in the `wp_enqueue_script()` function is an array of dependencies, all of the Gutenberg packages are registered and can be loaded by specifying them in the array, blocks and elements are shown as two common examples.

Recap at this point, we have a plugin which loads JavaScript, we're off to a good start.


## JavaScript versions and building

The Gutenberg Handbook shows examples in two syntaxes ES5 and ESNext, note ESNext is sometimes referred to as ES6. The ES5 code is compatible with almost all current browsers.

The ESNext syntax is compatible with most modern browsers, but unfortunately not IE11. Additionally, the ESNext code examples include JSX syntax, which requires a build step using webpack to transform into code that can be run in your browser.

For this tutorial, all examples are written as the ES5 variation of JavaScript that can be run straight in your browser and does not require an additional build step.


## Extending the Block Editor

This puts all the initial pieces in place for you to start extending the Block Editor.

Let's look at using the [Block Style Variation example](../../../../../docs/designers-developers/developers/filters/block-filters/#block-style-variations).

Replace the existing `console.log()` code in your `myguten.js` file with:

```js
wp.blocks.registerBlockStyle( 'core/quote', {
    name: 'fancy-quote',
    label: 'Fancy Quote'
} );
```

After you add the `wp.blocks.registerBlockStyle` code, save the `myguten.js` file, and then create a new post in the Block Editor.

Add a quote block, and in the right sidebar under Styles, you will see your new Fancy Quote style listed. You can go back to the JavaScript and change the label to "Fancy Pants" and reload, and you will see the new label.

Previewing or Publishing the post, you will not see a visible change. However, if you look at the source, you will see `is-style-fancy-quote` class name attached to your quote.

Go ahead and create a `style.css` file with:

```css
.is-style-fancy-quote {
	font-size: 64px;
}

```

and enqueue the CSS by adding the following to your `myguten-plugin.php`:

```php
function myguten_stylesheet() {
	wp_enqueue_style( 'myguten-style', plugins_url( 'style.css', __FILE__ ) );
}
add_action( 'enqueue_block_assets', 'myguten_stylesheet' );
```

And then when you view the page, you will see it in a very large font.


