# Extending the Query Loop block

The Query Loop block is a powerful tool that allows users to cycle through a determined list of posts and display a certain set of blocks that will inherit the context of each of the posts in the list. For example, it can be set to cycle through all the posts of a certain category and for each of those posts display their featured image. And much more, of course!

But precisely because the Query Loop block is so powerful and allows for great customization, it can also be daunting. Most users wouldn't want to be presented with the full capabilities of the Query Loop block, as most users wouldn't be familiar with the concept of a “query” and its associated technical terms. Instead, most users will likely appreciate a pre-set version of the block, with fewer settings to adjust and clearer naming. The Post List variation offered by default is a good example of this practice: the user will be using the Query Loop block without being exposed to its technicalities, and will also be more likely to discover and understand the purpose of the block.

In the same manner, a lot of extenders might need a way to present bespoke versions of the block, with their own presets, additional settings and without customization options which are irrelevant to their use-case (often, for example, their custom post type). The Query Loop block offers very powerful ways to create such variations.

## Extending the block with variations

By registering your own block variation with some specific Query Loop block settings, you can have finer control over how it is presented, while still being able to use the full capabilities which the Query Loop block offers underneath. If you are not familiar with block variations, learn more about them [here](/docs/reference-guides/block-api/block-variations.md).

With the block variations API you can provide the default settings that make the most sense for your use-case.

In order to have a Query Loop variation properly working, we'll need to:
- Register the block variation for the `core/query` block with some default values
- Define a layout for the block variation
- Use the `namespace` attribute in the `isActive` block variation property

Let's go on a journey, for example, of setting up a variation for a plugin which registers a `book` [custom post type](https://developer.wordpress.org/plugins/post-types/).

### 1. Offer sensible defaults

Your first step would be to create a variation which will be set up in such a way to provide a block variation which will display by default a list of books instead of blog posts. The full variation code will look something like this:

```js
const MY_VARIATION_NAME = 'my-plugin/books-list';

registerBlockVariation( 'core/query', {
	name: MY_VARIATION_NAME,
	title: 'Books List',
	description: 'Displays a list of books',
	isActive: ( { namespace, query } ) => {
		return (
			namespace === MY_VARIATION_NAME
			&& query.postType === 'book'
		);
	},
	icon: /** An SVG icon can go here*/,
	attributes: {
		namespace: MY_VARIATION_NAME,
		query: {
			perPage: 6,
			pages: 0,
			offset: 0,
			postType: 'book',
			order: 'desc',
			orderBy: 'date',
			author: '',
			search: '',
			exclude: [],
			sticky: '',
			inherit: false,
		},
	},
	scope: [ 'inserter' ],
	}
);
```

If that sounds like a lot, don't fret, let's go through each of the properties here and see why they are there and what they are doing.

Essentially, you would start with something like this:

```js
registerBlockVariation( 'core/query', {
	name: 'my-plugin/books-list',
	attributes: {
		query: {
			/** ...more query settings if needed */
			postType: 'book',
		},
	},
} );
```

In this way, the users won't have to choose the custom `postType` from the dropdown, and be already presented with the correct configuration. However, you might ask, how is a user going to find and insert this variation? Good question! To enable this, you should add:

```js
{
	/** ...variation properties */
	scope: [ 'inserter' ],
}
```

In this way, your block will show up just like any other block while the user is in the editor and searching for it. At this point you might also want to add a custom icon, title and description to your variation, just like so:

```js
{
	/** ...variation properties */
	title: 'Books List',
	description: 'Displays a list of books',
	icon: /* Your svg icon here */,
}
```

At this point, your custom variation will be virtually indistinguishable from a stand-alone block. Completely branded to your plugin, easy to discover and directly available to the user as a drop in.

However, your query loop variation won't work just yet — we still need to define a layout so that it can render properly.

### 2. Customize your variation layout

Please note that the Query Loop block supports `'block'` as a string in the `scope` property. In theory, that's to allow the variation to be picked up after inserting the block itself. Read more about the Block Variation Picker [here](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-variation-picker/README.md).

However, it is **unadvisable** to use this currently, this is due to the Query Loop setup with patterns and `scope: [ 'block' ]` variations, all of the selected pattern's attributes will be used except for `postType` and `inherit` query properties, which will likely lead to conflicts and non-functional variations.

To circumvent this, there two routes, the first one is to add your default `innerBlocks`, like so:

```js
innerBlocks: [
	[
		'core/post-template',
		{},
		[ [ 'core/post-title' ], [ 'core/post-excerpt' ] ],
	],
	[ 'core/query-pagination' ],
	[ 'core/query-no-results' ],
],
```

By having `innerBlocks` in your variation you essentially skip the setup phase of Query Loop block with suggested patterns and the block is inserted with these inner blocks as its starting content.

The other way would be to register patterns specific to your variation, which are going to be suggested in the setup, and replace flows of the block.

The Query Loop block determines if there is an active variation of itself and if there are specific patterns available for this variation. If there are, these patterns are going to be the only ones suggested to the user, without including the default ones for the original Query Loop block. Otherwise, if there are no such patterns, the default ones are going to be suggested.

In order for a pattern to be “connected” with a Query Loop variation, you should add the name of your variation prefixed with the Query Loop name (e.g. `core/query/$variation_name`) to the pattern's `blockTypes` property. For more details about registering patterns [see here](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/).

If you have not provided `innerBlocks` in your variation, there is also a way to suggest “connected” variations when the user selects `Start blank` in the setup phase. This is handled in a similar fashion with “connected” patterns, by checking if there is an active variation of Query Loop and if there are any connected variations to suggest.

In order for a variation to be connected to another Query Loop variation we need to define the `scope` attribute with `['block']` as value and the `namespace` attribute defined as an array. This array should contain the names(`name` property) of any variations they want to be connected to.

For example, if we have a Query Loop variation exposed to the inserter(`scope: ['inserter']`) with the name `products`, we can connect a scoped `block` variation by setting its `namespace` attribute to `['products']`. If the user selects this variation after having clicked `Start blank`, the namespace attribute will be overridden by the main inserter variation.

### 3. Making Gutenberg recognize your variation

There is one slight problem you might have realized after implementing this variation: while it is transparent to the user as they are inserting it, Gutenberg will still recognize the variation as a Query Loop block at its core and so, after its insertion, it will show up as a Query Loop block in the tree view of the editor, for instance.

We need a way to tell the editor that this block is indeed your specific variation. This is what the `isActive` property is made for: it's a way to determine whether a certain variation is active based on the block's attributes. You could use it like this:

```js
{
	/** ...variation properties */
	isActive: ( { namespace, query } ) => {
		return (
			namespace === MY_VARIATION_NAME
			&& query.postType === 'book'
		);
	},
}
```

You might be tempted to only compare the `postType` so that Gutenberg will recognize the block as your variation any time the `postType` matches `book`. This casts a net too wide, however, as other plugins might want to publish variations based on the `book` post type too, or we might just not want the variation to be recognized every time the user sets the type to `book` manually through the editor settings.

That's why the Query Loop block exposes a special attribute called `namespace`. It really doesn't do anything inside the block implementation, and it's used as an easy and consistent way for extenders to recognize and scope their own variation. In addition, `isActive` also accepts just an array of strings with the attributes to compare. Often, `namespace` would be sufficient, so you would use it like so:

```js
{
	/** ...variation properties */
	attributes: {
		/** ...variation attributes */
		namespace: 'my-plugin/books-list',
	},
	isActive: [ 'namespace' ],
}
```

Like so, Gutenberg will know that it is your specific variation only in the case it matches your custom namespace! So convenient!

## Extending the query

Even with all of this, your custom post type might have unique requirements: it might support certain custom attributes that you might want to filter and query for, or some other query parameters might be irrelevant or even completely unsupported! We have build the Query Loop block with such use-cases in mind, so let's see how you can solve this problem.

### Disabling irrelevant or unsupported query controls

Let's say you don't use at all the `sticky` attribute in your books, so that would be totally irrelevant to the customization of your block. In order to not confuse the users as to what a setting might do, and only exposing a clear UX to them, we want this control to be unavailable. Furthermore, let's say that you don't use the `author` field at all, which generally indicates the person who has added that post to the database, instead you use a custom `bookAuthor` field. As such, not only keeping the `author` filter would be confusing, it would outright “break” your query.

For this reason, the Query Loop block variations support a property called `allowedControls`, which accepts an array of keys of the controls we want to display on the inspector sidebar. By default, we accept all the controls, but as soon as we provide an array to this property, we want to specify only the controls which are going to be relevant for us!

As of Gutenberg version 14.2, the following controls are available:

-   `inherit` - Shows the toggle switch for allowing the query to be inherited directly from the template.
-   `postType` - Shows a dropdown of available post types.
-   `order` - Shows a dropdown to select the order of the query.
-   `sticky` - Shows a dropdown to select how to handle sticky posts.
-   `taxQuery` - Shows available taxonomies filters for the currently selected post type.
-   `author` - Shows an input field to filter the query by author.
-   `search` - Shows an input field to filter the query by keywords.
-   `format` - Shows an input field to filter the query by array/collection of [formats](https://developer.wordpress.org/advanced-administration/wordpress/post-formats/#supported-formats).
-   `parents` - Shows an input field to filter the query using parent(s) entity.

In our case, the property would look like this:

```js
{
	/** ...variation properties */
	allowedControls: [ 'inherit', 'order', 'taxQuery', 'search' ],
}
```

If you want to hide all the above available controls, you can set an empty array as a value of `allowedControls`.

Notice that we have also disabled the `postType` control. When the user selects our variation, why show them a confusing dropdown to change the post type? On top of that it might break the block as we can implement custom controls, as we'll see shortly.

### Adding additional controls

Because our plugin uses custom attributes that we need to query, we want to add our own controls to allow the users to select those instead of the ones we have just disabled from the core inspector controls. We can do this via a [React HOC](https://reactjs.org/docs/higher-order-components.html) hooked into a [block filter](https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/), like so:

```jsx
import { InspectorControls } from '@wordpress/block-editor';

export const withBookQueryControls = ( BlockEdit ) => ( props ) => {
	// We only want to add these controls if it is our variation,
	// so here we can implement a custom logic to check for that, similar
	// to the `isActive` function described above.
	// The following assumes that you wrote a custom `isMyBooksVariation`
	// function to handle that.
	return isMyBooksVariation( props ) ? (
		<>
			<BlockEdit key="edit" { ...props } />
			<InspectorControls>
				<BookAuthorSelector /> { /** Our custom component */ }
			</InspectorControls>
		</>
	) : (
		<BlockEdit key="edit" { ...props } />
	);
};

addFilter( 'editor.BlockEdit', 'core/query', withBookQueryControls );
```

Of course, you'll be responsible for implementing the logic of your control (you might want to take a look at [`@wordpress/components`](https://www.npmjs.com/package/@wordpress/components) to make your controls fit seamlessly within the Gutenberg UI). Any extra parameter you assign within the `query` object inside the blocks attributes can be used to create a custom query according to your needs, with a little extra effort.

Currently, you'll likely have to implement slightly different paths to make the query behave correctly both on the front-end side (i.e. on the end user's side) and to show the correct preview on the editor side.

```js
{
	/** ...variation properties */
	attributes: {
		/** ...variation attributes */
		query: {
			/** ...more query settings if needed */
			postType: 'book',
			/** Our custom query parameter */
			bookAuthor: 'J. R. R. Tolkien'
		}
	}
}
```

### Making your custom query work on the front-end side

The Query Loop block functions mainly through the Post Template block which receives the attributes and builds the query from there. Other first-class children of the Query Loop block (such as the Pagination block) behave in the same way. They build their query and then expose the result via the filter [`query_loop_block_query_vars`](https://developer.wordpress.org/reference/hooks/query_loop_block_query_vars/).

You can hook into that filter and modify your query accordingly. Just make sure you don't cause side-effects to other Query Loop blocks by at least checking that you apply the filter only to your variation!

```php
if( 'my-plugin/books-list' === $block[ 'attrs' ][ 'namespace' ] ) {
	add_filter(
		'query_loop_block_query_vars',
		function( $query ) {
			/** You can read your block custom query parameters here and build your query */
		},
	);
}
```

(In the code above, we assume you have some way to access the block, for example within a [`pre_render_block`](https://developer.wordpress.org/reference/hooks/pre_render_block/) filter, but the specific solution can be different depending on the use-case, so this is not a firm recommendation).

### Making your custom query work on the editor side

To finish up our custom variation, we might want the editor to react to changes in our custom query and display an appropriate preview accordingly. This is not required for a functioning block, but it enables a fully integrated user experience for the consumers of your block.

The Query Loop block fetches its posts to show the preview using the [WordPress REST API](https://developer.wordpress.org/rest-api/). Any extra parameter added to the `query` object will be passed as a query argument to the API. This means that these extra parameters should be either supported by the REST API, or be handled by custom filters such as the [`rest_{$this->post_type}_query`](https://developer.wordpress.org/reference/hooks/rest_this-post_type_query/) filter which allows you to hook into any API request for your custom post type. Like so:

```php
add_filter(
	'rest_book_query',
	function( $args, $request ) {
		/** We can access our custom parameters from here */
		$book_author = $request->get_param( 'bookAuthor' );
		/** ...your custom query logic */
	}
);
```

And, just like that, you'll have created a fully functional variation of the Query Loop block!
