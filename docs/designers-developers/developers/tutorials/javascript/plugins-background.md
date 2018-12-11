
## Plugins Background

The primary means of extending WordPress remains the plugin, see [Plugin Basics](https://developer.wordpress.org/plugins/the-basics/) for more. The quick start is to create a new directory in `wp-content/plugins/` to hold your plugin code, for our example you can call it `myguten-plugin`.

Inside of this new directory, create a file called `myguten-plugin.php` which will be the server-side code the runs when your plugin is active. For now you can place the following in that file:

```php
<?php
/*
Plugin Name: Fancy Quote
*/
```

So you should have a directory `wp-content/plugins/myguten-plugin/` which has the single file `myguten-plugin.php`. Once that is in place, you can go to your plugins list in `wp-admin` and you should see your plugin listed.

Click **Activate** and your plugin will load with WordPress.
