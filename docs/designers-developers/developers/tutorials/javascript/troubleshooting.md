## Troubleshooting

It's not working, what do I do?

### Console Log

The console log is a JavaScript developer's best friend, it is a good practice to work with it open. If there are any errors this is where they will show up. See Mozilla's [JavaScript console](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools#The_JavaScript_console) documentation for more.

Check the JavaScript console for any errors. Here is an example, which shows a syntax error on line 6.

![console error](../../../../../docs/designers-developers/developers/tutorials/javascript/console-error.png)


### Confirm all dependencies are loaded

The console log will show an error if a dependency your JavaScript code uses has not been declared and loaded in the browser. In the example, if `myguten.js` script is enqueued without declaring the `wp-block` dependency, the console log will show:

<img src="../../../../../docs/designers-developers/developers/tutorials/javascript/error-blocks-undefined.png" width=448 title="error wp.blocks is undefined"/>


You can correct by checking your `wp_enqueue_script` function includes all packages listed that are used:

```js
wp_enqueue_script( 'myguten-script',
	plugins_url( 'myguten.js', __FILE__ ),
	array( 'wp-blocks' )
);
```


### Confirm JavaScript is Loading

If you are not seeing your changes, another place to check is to confirm your JavaScript file is being enqueued. You can look at the page source, right-click View Page Source, and look for the `<script>` tag that loads your file. In our example, you would searching for `myguten.js` and confirm it is being loaded.

If you do not see the file being loaded, doublecheck the enqueue function is correct. You can also check your server logs to see if there is an error messages.
