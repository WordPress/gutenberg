
## Loading JavaScript

With the plugin in place, you can add the code that loads the JavaScript. This methodology follows the standard WordPress procedure of enqueuing scripts, see [enqueuing section of the Plugin Handbook](https://developer.wordpress.org/plugins/javascript/enqueuing/).

Add the following code to your `myguten-plugin.php` file:

```php
function myguten_enqueue() {
	wp_enqueue_script( 'myguten-script',
		plugins_url( 'myguten.js', __FILE__ )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

The script enqueuing uses the `enqueue_block_editor_assets` hook which loads the JavaScript file `myguten.js` when the block editor loads.

Create a file called `myguten.js` and add:

```js
console.log( "I'm loaded!" );
```

Now start a new post in the block editor, and check your browser Developer Tools. You should see the message in your console log. See [Mozilla's What are browser developer tools?](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) if you need more information, the area to become most familiar with is [The JavaScript console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console).


**Note for Theme Developers:**  The above method of enqueing is used for plugins, if you are extending Gutenberg for your theme there is a minor difference, you will use the `get_template_directory_uri()` function instead of `plugins_url()`. So for a theme, the enqueue example is:

```php
function myguten_enqueue() {
	wp_enqueue_script( 'myguten-script',
		get_template_directory_uri() . '/myguten.js'
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

### Recap

At this point, you have a plugin in the directory `wp-content/plugins/myguten-plugin` with two files. The PHP server-side code in `myguten-plugin.php`, and the JavaScript which runs in the browser in `myguten.js`.



