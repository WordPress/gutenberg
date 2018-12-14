# Loading JavaScript

With the plugin in place, you can add the code that loads the JavaScript. This methodology follows the standard WordPress procedure of enqueuing scripts, see [enqueuing section of the Plugin Handbook](https://developer.wordpress.org/plugins/javascript/enqueuing/).

Add the following code to your `myguten-plugin.php` file:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		plugins_url( 'myguten.js', __FILE__ )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

The `enqueue_block_editor_assets` hook is used, which is called when the block editor loads, and will enqueue the JavaScript file `myguten.js`.

Create a file called `myguten.js` and add:

```js
console.log( "I'm loaded!" );
```

Next, create a new post in the block editor.

We'll check the JavaScript console in your browser's Developer Tools, to see if the message is displayed. If you're not sure what developer tools are, Mozilla's ["What are browser developer tools?"](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) documentation provides more information, including more background on the [JavaScript console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console).

If your code is registered and enqueued correctly, you should see a message in your console:

![Console Log Message Success](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/js-tutorial-console-log-success.png)

**Note for Theme Developers:**  The above method of enqueing is used for plugins. If you are extending the Block Editor for your theme there is a minor difference, you will use the `get_template_directory_uri()` function instead of `plugins_url()`. So for a theme, the enqueue example is:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		get_template_directory_uri() . '/myguten.js'
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

### Recap

At this point, you have a plugin in the directory `wp-content/plugins/myguten-plugin` with two files: the PHP server-side code in `myguten-plugin.php`, and the JavaScript which runs in the browser in `myguten.js`.

This puts all the initial pieces in place for you to start extending the Block Editor.
