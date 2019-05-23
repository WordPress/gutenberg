# Plugins Background

The primary means of extending WordPress is the plugin. The WordPress [Plugin Basics](https://developer.wordpress.org/plugins/the-basics/) documentation provides details on building a plugin. 

The quickest way to start is to create a new directory in `wp-content/plugins/` to contain your plugin code. For this example, call it `myguten-plugin`.

Inside this new directory, create a file called `myguten-plugin.php`. This is the server-side code that runs when your plugin is active. 

For now, add the following code in the file:

```php
<?php
/*
Plugin Name: Fancy Quote
*/
```

To summarize, you should have a directory `wp-content/plugins/myguten-plugin/` which has the single file `myguten-plugin.php`. 

Once that is in place, go to your plugins list in `wp-admin` and you should see your plugin listed.

Click **Activate** and your plugin will load with WordPress.
