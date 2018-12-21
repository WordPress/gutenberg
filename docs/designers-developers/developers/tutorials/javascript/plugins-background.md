# Plugins Background

The primary means of extending WordPress is the plugin. WordPress' [Plugin Basics](https://developer.wordpress.org/plugins/the-basics/) documentation provides for more details on building a plugin. The quickest way to start is to create a new directory in `wp-content/plugins/` to hold your plugin code, for this example you can call it `myguten-plugin`.

Inside of this new directory, create a file called `myguten-plugin.php` which is the server-side code that runs when your plugin is active. For now place the following in that file:

```php
<?php
/*
Plugin Name: Fancy Quote
*/
```

To summarize, you should have a directory `wp-content/plugins/myguten-plugin/` which has the single file `myguten-plugin.php`. Once that is in place, go to your plugins list in `wp-admin` and you should see your plugin listed.

Click **Activate** and your plugin will load with WordPress.
