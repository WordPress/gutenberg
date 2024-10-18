# Bindings

Block Bindings API lets you “bind” dynamic data to the block’s attributes, which are then reflected in the final HTML markup that is output to the browser on the front end.

An example could be connecting an Image block url attribute to a function that returns random images from an external API.

```html
<!-- wp:image {
	"metadata":{
		"bindings":{
			"url":{
				"source":"my-plugin/get-random-images"
			}
		}
	}
} -->
```


## Compatible blocks and its attributes

