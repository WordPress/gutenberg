# Gutenberg by Front

We made [Gutenberg](https://github.com/Wordpress/gutenberg) editor a little more **customizable**! 

Gutenberg editor can **be easly included in your apps** with this [package](https://github.com/front/gutenberg). Also you can customize blocks menu panels, blocks categories, document panels and more! 

This package is based on [Gutenberg v3.0.1](https://github.com/WordPress/gutenberg/releases/tag/v3.0.1).

## Table of contents
* [Installation](#installation)
* [Usage](#usage)
    * [Gutenberg Stores](#gutenberg-stores)
    * [Registering Custom Blocks](#registering-custom-blocks)
* [Global variables](#global-variables)
    * [apiRequest](#apirequest)
        * [Post Types](#post-types)
        * [Posts and Pages](#posts-and-pages)
        * [Categories](#categories)
        * [Index](#index)
        * [Media](#media)
    * [url](#url)
* [Customize your Gutenberg](#customize-your-gutenberg)
    * [Inserter Menu (blocks)](#inserter-menu-blocks)
    * [Block Categories](#block-categories)
    * [Rows](#rows)
    * [Dynamic Row](#dynamic-row)
    * [Posts Panel](#posts-panel)
        * [Post Block](#post-block)
    * [Events](#events)

## Installation

**Gutenberg by Frontkom** is available through npm.

```sh
npm install @frontkom/gutenberg
```

[↑ Go up to Table of contents](#table-of-contents)

## Usage

We've tried to make it easy to import **Gutenberg by Frontkom** editor in your apps.

```js
// Importing global variables that Gutenberg requires
import './globals'; 

// Importing initialization method
import { initializeEditor } from '@frontkom/gutenberg';

// Don't forget to import the style
import '@frontkom/gutenberg/build/css/core-blocks/style.css';
import '@frontkom/gutenberg/build/css/style.css';
import '@frontkom/gutenberg/build/css/core-blocks/edit-blocks.css';
import '@frontkom/gutenberg/build/css/core-blocks/theme.css';

// DOM element id where editor will be displayed
const target = 'editor';

// Post properties
const postType = 'post'; // or 'page'
const postId = 123;

// Some editor settings
const settings = { 
    alignWide: true,
    availableTemplates: [],
    allowedBlockTypes: true, 
    disableCustomColors: false, 
    disablePostFormats: false,
    titlePlaceholder: "Add title",
    bodyPlaceholder: "Write your story",
    isRTL: false,
    autosaveInterval: 10,
    ...
};

// Post properties to override
const overridePost = {};

// Et voilá... Initializing the editor!
initializeEditor( target, postType, postId, settings, overridePost );
```

**Note**: Gutenberg requires utf-8 encoding, so don't forget to add `<meta charset="utf-8">` tag to your html `<head>`.

[↑ Go up to Table of contents](#table-of-contents)

### Gutenberg Stores

Additionally, after initializing the editor, you can have access to Gutenberg stores (`core`, `core/blocks`, `core/data`, `core/edit-post`, `core/editor`, `core/viewport`) and respective actions using `select` and `dispatch` methods:

```js
// Importing select and dispatch methods from @frontkom/gutenberg package
import { select, dispatch } from '@frontkom/gutenberg';

// Use dispatch to change the state of something
dispatch( 'core/edit-post' ).openGeneralSidebar( 'edit-post/block' );
dispatch( 'core/edit-post' ).closeGeneralSidebar();

// Use select to get the state of something
select( 'core/editor' ).getEditedPostContent();
// <!-- wp:paragraph -->
// <p>Hello</p>
// <!-- /wp:paragraph -->

```

[↑ Go up to Table of contents](#table-of-contents)

### Registering Custom Blocks

You can create your custom blocks using the `registerBlockType` method and the Gutenberg blocks and components. Check out the example below and the Wordpress [documentation](https://wordpress.org/gutenberg/handbook/blocks/) to read more about it.

```js
import {
    registerBlockType,
    RichText,
    BlockControls,
    AlignmentToolbar,
} from '@frontkom/gutenberg';

registerBlockType( 'custom/my-block', {
    title: 'My first block',
    icon: 'universal-access-alt',
    category: 'common',
    attributes: {
        content: {
            type: 'array',
            source: 'children',
            selector: 'p',
        },
        alignment: {
            type: 'string',
        },
    },
    edit( { attributes, className, setAttributes } ) {
        const { content, alignment } = attributes;

        function onChangeContent( newContent ) {
            setAttributes( { content: newContent } );
        }

        function onChangeAlignment( newAlignment ) {
            setAttributes( { alignment: newAlignment } );
        }

        return [
            <BlockControls>
                <AlignmentToolbar
                    value={ alignment }
                    onChange={ onChangeAlignment }
                />
            </BlockControls>,
            <RichText
                tagName="p"
                className={ className }
                style={ { textAlign: alignment } }
                onChange={ onChangeContent }
                value={ content }
            />
        ];
    },
    save( { attributes, className } ) {
        const { content, alignment } = attributes;

        return (
            <RichText.Content
                className={ className }
                style={ { textAlign: alignment } }
                value={ content }
            />
        );
    },
} );

```

[↑ Go up to Table of contents](#table-of-contents)

## Global variables 

Gutenberg depends on several global variables: `wp`, `userSettings`, `wpEditorL10n`, `wpApiSettings`, etc and probably during your Gutenberg experiencie you will discover other required variables, please share with us if you feel they are important to Gutenberg execution. 

Here we're only presenting those variables which - by our experience - we belive are crucial to Gutenberg and already set to them default values. If you don't set them up, you'll see that Gutenberg editor won't run.

So we recommend you to set up them all in one file called `globals.js` or `settings.js` for example and import them **before** Gutenberg call. Feel free to override Gutenberg global variables if you need.

```js
// globals.js

window.wp = {
    apiRequest, 
    url: { addQueryArgs },
    ...,
};

// set your root path
window.wpApiSettings = { 
    root: 'YOUR_ROOT_PATH',
    ...,
};
```

[↑ Go up to Table of contents](#table-of-contents)

We are working to include on **Gutenberg by Frontkom** all settings that shouldn't be part of your apps, but you always can override them if you need.

### apiRequest

Those two are very important for comunication between the editor and remaining app, so you should set them up accordingly your needs. 

***apiRequest*** is the method that will handle with data operations on Gutenberg, like getting resources (categories for example), saving page changes or deleting pages, etc. It receives an object with `path`, `method`, `data`, etc, so you can treat it as you want.

```js
function apiRequest( options ) {
    // Do something with those options like calling an API 
    // or actions from your store...
}
```

Next, we will show some commons API requests Gutenberg does and the respective response it expects. For more information, you can check the [WordPress REST API Documentation](https://developer.wordpress.org/rest-api/reference/post-revisions/).

[↑ Go up to Table of contents](#table-of-contents)

#### Post Types

The Gutenberg editor will ask for available **Post Types** through `/wp/v2/types/?context=edit` request. In addition to the _type_ properties that can be checked in [WordPress documentation](https://developer.wordpress.org/rest-api/reference/post-types/), **Gutenberg by Frontkom** provides the following:

```js
{
    ...,   
    autosaveable: false, // to disable Post Autosave featured
    publishable: false,  // to disable Post Publish featured
    saveable: false,     // to disable Post Save featured
    supports: {
        ...,
        'media-library': false,    // to disable Media library from WordPress
        posts: true,               // to add PostsPanel to Documents tab
        'template-settings': true, // to add TemplateSettingsPanel to Documents tab
    },
}
```

[↑ Go up to Table of contents](#table-of-contents)

#### Posts and Pages

Check the WordPress API documentation for [Posts](https://developer.wordpress.org/rest-api/reference/posts/) and [Pages](https://developer.wordpress.org/rest-api/reference/pages/) requests.

[↑ Go up to Table of contents](#table-of-contents)

#### Categories

Check the WordPress API documentation for [Categories](https://developer.wordpress.org/rest-api/reference/categories/).

[↑ Go up to Table of contents](#table-of-contents)

#### Index

Gutenberg will ask for the [theme features](https://codex.wordpress.org/Theme_Features) through the index request (`/`). The response should be the following object.

```js
{
    ...,
    theme_supports: {
        formats: [ 'standard', 'aside', 'image', 'video', 'quote', 'link', 'gallery', 'audio' ],
        'post-thumbnails': true,
    },
    ...,
}
```

[↑ Go up to Table of contents](#table-of-contents)

#### Media

Here is the WordPress API documentation for [Media](https://developer.wordpress.org/rest-api/reference/media/). The **Gutenberg by Frontkom** introduces the `data` property which is an object with all data attributes you want to add to image/media DOM element.

```js
{
    ...,
    id: 1527069591355,    
    link: MEDIA_LINK_HERE,
    source_url: MEDIA_URL_HERE,
    // Additionaly, you can add some data attributes for images for example
    data: { entity_type: 'file', entity_uuid: 'e94e9d8d-4cf4-43c1-b95e-1527069591355' }
    ...,
}
```

[↑ Go up to Table of contents](#table-of-contents)

### url

***url*** should has a function called `addQueryArgs( url, args )` that handles with `url` and `args` and returns the final url to different actions. The original implementation is the following, feel free to keep it or change it according to your needs.

```js
/**
 * External dependencies
 */
import { parse, format } from 'url';
import { parse as parseQueryString, stringify } from 'querystring';

/**
 * Appends arguments to the query string of the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
export function addQueryArgs( url, args ) {
    const parsedURL = parse( url, true );
    const query = { ...parsedURL.query, ...args };
    delete parsedURL.search;

    return format( { ...parsedURL, query } );
}
```

[↑ Go up to Table of contents](#table-of-contents)

## Customize your Gutenberg

Following the same logic, we've created the `customGutenberg` global object where you can set eveything that we made customizable on Gutenberg.

```js
window.customGutenberg = { ... };
```

As the other global variables, also `customGutenberg` should be defined **before** Gutenberg import.

Important to say that Gutenberg works perfectly without the settings of this object :)

[↑ Go up to Table of contents](#table-of-contents)

### Inserter Menu (blocks)

You can customize the panels are displayed on the editor *Add block popup*, like as which block categories they should display. By default, Gutenberg display `suggested`, `shared` and categories panels.

```js
window.customGutenberg = {
    ...,
    blocks: {
        suggested: false,
        shared: false,
        categories: [ 'rows', 'common' ],
    },
    ...,
};
```

[↑ Go up to Table of contents](#table-of-contents)

### Block Categories

You can set which block categories and consequently which blocks will be displayed on your editor. By default, Gutenberg has `common`, `formatting`, `layout`, `widgets`, `embed` and `shared` blocks categories and we added our [`rows`](#rows).

```js
window.customGutenberg = {
    ...,
    categories: [ 
        // 'common' category should always be included because of 
        // the default block - paragraph
        { slug: 'common', title: 'Common blocks' },
        { slug: 'formatting', title: 'Formatting' },
        { slug: 'layout', title: 'Layout Elements' },
        ...,
    ],
    ...,
};
```

[↑ Go up to Table of contents](#table-of-contents)

### Rows

**Gutenberg by Frontkom** introduces a new category of blocks: the rows. Rows are divided in columns (minimum of 2) which you can defined by its size (1, 2, 3, ...). The total of columns are 12 and it must be the sum of `cols` array items. By default, the rows blocks will be available under the Blocks tab.

```js
window.customGutenberg = {
    ...,
    rows: [
        { 
            cols: [ 6, 6 ], 
            title: 'col6 x 2', 
            description: '2 eq columns layout', 
        },
        { 
            cols: [ 4, 4, 4 ], 
            title: 'col4 x 3', 
            description: '3 eq columns layout',
        },
        { 
            cols: [ 7, 5 ], 
            title: 'col7-col5', 
            description: 'A col7 and a col5',
            },
        { 
            cols: [ 2, 8, 2 ], 
            title: 'col2-col8-col2', 
            description: 'A col2, a col8 and a col2',
        },
    ],
    ...,
};
```

![Rows example](https://raw.githubusercontent.com/front/gutenberg/master/gutenberg-package/rows_screenshot.png)

[↑ Go up to Table of contents](#table-of-contents)

### Dynamic Row

It works like a section that could be slipt in several columns with different widhts.

[↑ Go up to Table of contents](#table-of-contents)

### Posts Panel

The **Posts Panel** (`postType.supports[ 'posts' ] = true`) contains a list of posts which could be filtered by category and/or searched be name and then can be added to your page in form of an (Post block)[#post-block] by drag and drop.

[↑ Go up to Table of contents](#table-of-contents)

#### Post Block

The **Post Block** is another kind of blocks created by **Gutenberg by Frontkom** which is composed by a cover image and a title.

![Post Block example](https://raw.githubusercontent.com/front/gutenberg/master/gutenberg-package/post_block_screenshot.png)

[↑ Go up to Table of contents](#table-of-contents)

### Events

**Gutenberg by Frontkom** makes possible to define callbacks (or effects) for Gutenberg actions. Since it is an experimental feature, we are only providing this for 'OPEN_GENERAL_SIDEBAR', 'CLOSE_GENERAL_SIDEBAR' and 'REMOVE_BLOCKS' actions.

```js
window.customGutenberg = {
    ...,
    events: {
        'OPEN_GENERAL_SIDEBAR': function( action, store ) {
            console.log( 'OPEN_GENERAL_SIDEBAR', action, store );
        },
        'CLOSE_GENERAL_SIDEBAR': function( action, store ) {
            console.log( 'CLOSE_GENERAL_SIDEBAR', action, store );
        },
        'REMOVE_BLOCKS': function( action, store ) {
            console.log( 'REMOVE_BLOCKS', action, store );
        },
    },
    ...,
};
```

[↑ Go up to Table of contents](#table-of-contents)
