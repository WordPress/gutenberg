# Troubleshooting

If you're having trouble getting your code to work, here are a few ways to troubleshoot.

## Console Log

The console log is a JavaScript developer's best friend. It is a good practice to work with it open, as it collects errors and notices into one place. See Mozilla's [JavaScript console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console) documentation for more.

Your first step in debugging should be to check the JavaScript console for any errors. Here is an example, which shows a syntax error on line 6:

![console error](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/js-tutorial-console-log-error.png)

## Confirm JavaScript is Loading

If you are not seeing your changes, check that your JavaScript file is being enqueued. Open the page source in your browser's web inspector (some browsers may allow you to view the page source by right clicking on the page and selecting "View Page Source"), and look for the `<script>` tag that loads your file. In our example, you would search for `myguten.js` and confirm it is being loaded.

If you do not see the file being loaded, doublecheck the enqueue function is correct. You can also check your server logs to see if there is an error messages.

## Confirm All Dependencies Are Loaded

The console log will show an error if a dependency your JavaScript code uses has not been declared and loaded in the browser. In the example, if `myguten.js` script is enqueued without declaring the `wp-blocks` dependency, the console log will show:

<img src="https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/js-tutorial-error-blocks-undefined.png" width=448 title="error wp.blocks is undefined"/>

You can correct by checking your `wp_enqueue_script` function includes all packages listed that are used:

```js
wp_enqueue_script(
	'myguten-script',
	plugins_url( 'myguten.js', __FILE__ ),
	array( 'wp-blocks' )
);
```

