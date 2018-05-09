# Gutenberg by Front

We made [Gutenberg](https://github.com/Wordpress/gutenberg) editor a little more **customizable**! 

Gutenberg editor can **be easly included in your apps** with this [package](https://github.com/front/gutenberg). Also you can customize blocks menu tabs, blocks categories, document panels and more! 

This package is based on [Gutenberg v2.8.0](https://github.com/WordPress/gutenberg/releases/tag/v2.8.0).

## Table of contents
* [Installation](#installation)
* [Usage](#usage)
* [Global variables](#global-variables)
    * [apiRequest](#apirequest)
        * [GET types](#get-types)
        * [PUT post or page](#put-post-or-page)
        * [GET categories](#get-categories)
    * [url](#url)
* [Customize your Gutenberg](#customize-your-gutenberg)
    * [Block Menu Tabs](#block-menu-tabs)
    * [Block Categories](#block-categories)
    * [Rows](#rows)
    * [Posts Panel](#posts-panel)
        * [Post Block](#post-block)
    * [Events](#events-experimental)

## Installation

**Gutenberg by Frontkom** is available through npm.

```sh
npm install @frontkom/gutenberg
```

## Usage

We've tried to make it easy to import **Gutenberg by Frontkom** editor in your apps.

```js
// Importing global variables Gutenberg requires
import './globals'; 

// Importing Gutenberg
import { initializeEditor } from '@frontkom/gutenberg';

// Don't forget to import the style
import '@frontkom/gutenberg/dist/blocks/style.css';
import '@frontkom/gutenberg/dist/blocks/edit-blocks.css';
import '@frontkom/gutenberg/dist/style.css';

// DOM element id where editor will be displayed
const target = 'editor'; 

// Page properties
const page = { 
    content: { 
        raw: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->', 
        rendered: '<p>Hello</p>' 
    },
    templates: '', // feel free to create your own templates
    title: { raw: 'My first page', rendered: '' },
    type: 'page', // or 'post'
    id: 12345,
    ...
};

// Some editor settings
const settings = { 
    alignWide: false,
    availableTemplates: [],
    disableCustomColors: false,
    titlePlaceholder: 'Add a title here...',
    ...
};

// Et voilá... Initializing the editor!
initializeEditor( target, page, settings );
```

**Note**: Gutenberg requires utf-8 encoding, so don't forget to add `<meta charset="utf-8">` tag to your html `<head>`.

## Global variables 

Gutenberg depends on several global variables: `wp`, `wpApiSettings`, `_wpDateSettings`, `userSettings`, `wpEditorL10n`, etc and probably during your Gutenberg experiencie you will discover other required variables, please share with us if you feel they are important to Gutenberg execution. 

Here we're only presenting those variables which - by our experience - we belive are crucial to Gutenberg and already set to them default values. If you don't set them up, you'll see that Gutenberg editor won't run.

So we recommend you to set up them all in one file called `globals.js` or `settings.js` for example and import them **before** Gutenberg call. Feel free to override Gutenberg global variables if you need.

```js
// globals.js

window.wp = {
    apiRequest, 
    url: { addQueryArgs },
    ...,
};

// set your locale
window._wpDateSettings = { 
    l10n: { 
        locale: 'pt_PT',
        ...,
    },
    ...,
};

// set your root path
window.wpApiSettings = { 
    root: 'YOUR_ROOT_PATH',
    ...,
};
```

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

Next, we will show some commons API requests Gutenberg does and the respective response it expects. For more information, you can check the [WordPress REST API Documentation](https://v2.wp-api.org/reference/).

#### GET types

When you initialize the editor, Gutenberg will request the settings related with the *postType* you choose (**post** or **page**), invoking this API request `/wp/v2/types/[postType]?context=edit`. Here is an example for a response (check documentation [here](https://v2.wp-api.org/reference/types/)):

```js
{
    labels: {
        ...,
        posts: 'Stories',
        ...,
    },
    name: 'Posts',
    rest_base: 'posts',
    slug: 'post',
    supports: {
        author: true,
        comments: false,
        custom-fields: true,
        thumbnail: false,
        title: true,
        // Gutenberg by Frontkom supports flags
        media-library: false,    // disable Media library from WordPress
        posts: true,             // add PostsPanel to sidebar
        template-settings: true, // add TemplateSettingsPanel to sidebar
        ...,
    },
    ...,
}
```

#### PUT post or page

To save a [post](https://v2.wp-api.org/reference/posts/) or a [page](https://v2.wp-api.org/reference/pages/) content, Gutenberg does a PUT request to `/wp/v2/[postType]/[id]` sending a `data` object with `content`, `id` and/or `title` ( if its **postType** requires it). The response should be an object like this:

```js
{
    id: 123456,
    content: { 
        raw: '<!-- wp:paragraph -->↵<p>World</p>↵<!-- /wp:paragraph -->',
        rendered: '<p>World</p>',
    },
    title: { 
        raw: 'Hello',
        rendered: 'Hello',
    }
    ...,
}
```

#### GET categories

The request to get all [categories](https://v2.wp-api.org/reference/categories/) is `/wp/v2/categories` and expects an array of the follow objects:

```js
{
    id: 1,
    name: 'Category 1',
    parent: 0,
    ...,
}
```

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

## Customize your Gutenberg

Following the same logic, we've created the `customGutenberg` global object where you can set eveything that we made customizable on Gutenberg.

```js
window.customGutenberg = { ... };
```

As the other global variables, also `customGutenberg` should be defined **before** Gutenberg import.

Important to say that Gutenberg works perfectly without the settings of this object :)

### Block Menu Tabs

You can customize the tabs are displayed on the editor *Add blocks popup*, like as which block categories they should display and how. By default, Gutenberg display `suggested`, `blocks`, `embeds` and `shared` tabs.

```js
window.customGutenberg = {
    ...,
    tabs: [ 
        {
            options: { 
                name: 'suggested', 
                title: 'Suggested', 
                className: 'editor-inserter__tab', 
            },
            tabScrollTop: 0, // scroll to top on opening
            sortItems( items, state ) { // sorting blocks by usage
                if ( ! state.filterValue ) {
                    return items;
                }
             }, 
             renderTabView( items ) { // don't render category headers
                 return items;
             },
        },
        {
            options: { 
                name: 'blocks', 
                title: 'Blocks', 
                className: 'editor-inserter__tab', 
            },
            tabScrollTop: 0,
            getItemsForTab() { // rendering blocks from which categories
                return ( item ) => item.category !== 'embed' && item.category !== 'shared';
            },
        },
        ...,
    ],
    ...,
};
```

### Block Categories

You can set which block categories and consequently which blocks will be displayed on your editor. By default, Gutenberg has `common`, `formatting`, `layout`, `widgets`, `embed` and `shared` blocks categories.

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

![Rows example](https://raw.githubusercontent.com/front/gutenberg/develop/rows_screenshot.png)

### Posts Panel

The **Posts Panel** (`postType.supports[ 'posts' ] = true`) contains a list of posts which could be filtered by category and/or searched be name and then can be added to your page in form of an (Post block)[#post-block] by drag and drop.

#### Post Block

The **Post Block** is another kind of blocks created by **Gutenberg by Frontkom** which is composed by a cover image and a title.

![Post Block example](https://raw.githubusercontent.com/front/gutenberg/develop/post_block_screenshot.png)

### Events (experimental)

**Gutenberg by Frontkom** makes possible to define a callback (or effect) for Gutenberg actions. Since it is an experimental feature, we are only providing this for 'OPEN_GENERAL_SIDEBAR' and 'CLOSE_GENERAL_SIDEBAR' actions.

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
    },
    ...,
};
```
