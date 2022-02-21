# Entity Records Types

!THIS IS WORK IN PROGRESS! I used bits of the GitHub discussion as the first draft here

## Overview

The types in this directory are designed to support the following use-cases:

* Context-aware type checks for entity records.
* Static type checks for *edited* entity records, where certain fields become strings instead of objects.

### Context-aware type checks for entity records

WordPress REST API returns different responses based on the `context` query parameter, which typically is one of `view`, `edit`, or `embed`. See the [REST API documentation](https://developer.wordpress.org/rest-api/) to learn more.

For example, requesting `/wp/v2/posts/1?context=view` yields:

```js
{
  "content": {
    "protected": false,
    "rendered": "\n<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n"
  },
  "title": {
    "rendered": "Hello world!"
  }
  // other fields
}
```

While requesting `/wp/v2/posts/1?context=edit`, yields:

```js
{
  "content": {
    "block_version": 1,
    "protected": false,
    "raw": "<!-- wp:paragraph -->\n<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n<!-- /wp:paragraph -->",
    "rendered": "\n<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>\n"
  },
  "title": {
    "raw": "Hello world!",
    "rendered": "Hello world!"
  }
  // other fields
}
```

And, finally, requesting `/wp/v2/posts/1?context=embed` yields:

```js
{
  // Note content is missing
  "title": {
    "rendered": "Hello world!"
  }
  // other fields
}
```

These contexts are supported by the core-data resolvers like `getEntityRecord()` and `getEntityRecords()` to retrieve the appropriate "flavor" of the data.

The types describing different entity records must thus be aware of the relevant API context. This is implemented using the `Context` type parameter. For example, the implementation of the `Post` type resembles the following snippet:

```ts
interface Post<C extends Context> {
	/**
	 * A named status for the post.
	 */
	status: ContextualField< PostStatus, 'view' | 'edit', C >;

	// ... other fields ...
}
```

The `status` field is a `PostStatus` when the requesting context is `view` or `edit`, but if requested with an `embed` context the field won't appear on the `Post` object at all.

### Static type checks for *edited* entity records, where certain fields become strings instead of objects.

When the `post` is retrieved using `getEntityRecord`, its `content` field is an object:

```js
const post = wp.data.select('core').getEntityRecord( 'postType', 'post', 1, { context: 'view' } )
// `post.content` is an object with two fields: protected and rendered
```

The block markup stored in `content` can only be rendered on the server so the REST API exposes both the raw markup and the rendered version. For example, `content.rendered` could used as a visual preview, and `content.raw` could be used to populate the code editor.

When updating that field from the JavaScript code, however, all we can set is the raw value that the server will eventually render. The API expects us to send a much simpler `string` form which is the raw form that needs to be stored in the database.

The types reflect this through the `Updatable<EntityRecord>` wrapper:

```ts
interface Post< C extends Context > {
  title: {
    raw: string;
    rendered: string;
  }
}

const post : Post< 'edit' > = ...
// post.title is an object with properties `raw` and `rendered`

const post : Updatable<Post< 'edit' >> = ...
// post.title is a string
```

The `getEditedEntityRecord` selector returns the Updatable version of the entity records:

```js
const post = wp.data.select('core').getEditedEntityRecord( 'postType', 'post', 1 );
// `post.content` is a string
```

## Helpers

@TODO – perhaps we could auto generate that from the docstrings in common.ts (to become helpers.ts?)

### Context

The REST API context parameter.

### ContextualField

`ContextualField` makes the field available only in the specified given contexts, and ensure the field is absent from the object when in a different context.

Example:

```ts
interface Post< C extends Context > {
	…
	modified: ContextualField< string, 'edit' | 'view', C >;
	password: ContextualField< string, 'edit', C >;
	…
}

const post: Post<'edit'> = …
// post.modified exists as a string
// post.password exists as a string

const post: Post<'view'> = …
// post.modified still exists as a string
// post.password is missing, undefined, because we're not in the `edit` context.
```

### OmitNevers

Removes all the properties of type never, even the deeply nested ones.

```ts
type MyType = {
  foo: string;
  bar: never;
  nested: {
    foo: string;
    bar: never;
  }
}
const x = {} as OmitNevers<MyType>;
// x is of type { foo: string; nested: { foo: string; }}
// The `never` properties were removed entirely
```

### Updatable

Updatable<EntityRecord> is a type describing Edited Entity Records. They are like
regular Entity Records, but they have all the local edits applied on top of the REST API data.

This turns certain field from an object into a string.

Entities like Post have fields that only be rendered on the server, like title, excerpt,
and content. The REST API exposes both the raw markup and the rendered version of those fields.
For example, in the block editor, content.rendered could used as a visual preview, and
content.raw could be used to populate the code editor.

When updating these rendered fields, JavaScript is not be able to properly render arbitrary block
markup. Therefore, it stores only the raw markup without the rendered part. And since that's a string,
the entire field becomes a string.

```ts
type Post< C extends Context > {
  title: RenderedText< C >;
}
const post = {} as Post;
// post.title is an object with raw and rendered properties

const updatablePost = {} as Updatable< Post >;
// updatablePost.title is a string
```

### RenderedText

A string that the server renders which often involves modifications from the raw source string.

For example, block HTML with the comment delimiters exists in `post_content` but those comments are stripped out when rendering to a page view. Similarly, plugins might modify content or replace shortcodes.

## Extending

Talk about interface merging here

Change the "full" version of these types to be inside a namespace `wpCoreData.BaseTypes` so that they can be extended.

```ts
// In core-data
export namespace wpCoreData.BaseTypes {
	export interface Comment< C extends Context > {
		id: number;
		// ...
	}
}

export type Comment< C extends Context > = OmitNevers<
	wpCoreData.BaseTypes.Comment< C >
>;

// In the plugin
namespace wpCoreData.BaseTypes {
  interface Comment < C extends Context > {
    newField: ContextualField<string, 'edit', C>;
  }
}
```

Interface merging has a huge upside: core-data selectors would return the extended types out of the box.
