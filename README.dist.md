# Gutenberg by Front

We made [Gutenberg](https://github.com/front/gutenberg) editor a little more customizable! Gutenberg editor can be easly used in your apps and you can customize things like which tabs and blocks categories or document panels to show and more! 

## Table of contents
* [Installation](#installation)
* [Usage](#usage)
* [Global variables](#global-variables)
	* [*apiRequest* and *url*](#apirequest-and-url)
* [Customize your Gutenberg](#customiza-your-gutenberg)
	* [Blocks Menu Tabs](#blocks-menu-tabs)
	* [Block Categories](#block-categories)
	* [Rows](#rows)
	* [Document Panels](#document-panels)
		* [Articles Panel](articles-panels)
		* [Article Block](article-block)
	* [Editor Settings](editor-settings)

## Installation

**Gutenberg by Frontkom** is available through npm.

```sh
npm install @frontkom/gutenberg
```

## Usage

We've tried to make it easy to import **Gutenberg by Frontkom** editor in your apps.

``` js
// Importing global variables Gutenberg requires
import './globals'; 

// Importing Gutenberg
import { registerCoreBlocks, initializeEditor } from '@frontkom/gutenberg';

// Don't forget to import the style
import '@frontkom/gutenberg/dist/blocks/style.css';
import '@frontkom/gutenberg/dist/blocks/edit-blocks.css';
import '@frontkom/gutenberg/dist/style.css';

// Registering the core blocks
registerCoreBlocks();

// DOM element id where editor will be displayed
const target = 'editor'; 

// Page properties
const page = { 
    content: { raw: '' },
    templates: '', // feel free to create your own templates
    title: { raw: 'My first page' },
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

Gutenberg depends on several global variables: `wp`, `wpApiSettings`, `_wpDateSettings`, `userSettings`, `wpEditorL10n`, etc. Probably during your Gutenberg experiencie you will discover other required variables, please share with us if you feel they are important to Gutenberg execution. 

Here we're only presenting those variables which - by our experience - we belive are crucial to Gutenberg. If you don't set them up, you'll see that Gutenberg editor won't run.

So we recommend you to set up them all in one file called `globals.js` or `settings.js` for example and import them before Gutenberg call. Feel free to override Gutenberg global variables if you need.

``` js
// globals.js

window.wp = window.wp || { };
window.wp.apiRequest = apiRequest;
window.wp.url = { addQueryArgs };

window._wpDateSettings = { 
    l10n: {
    	locale: 'pt_PT',
	months: [ 'January', ... ],
	monthsShort: [ 'Jan', ...],
	weekdays: [ 'Sunday', ...],
	meridiem: { am: 'am', pm: 'pm', AM: 'AM', PM: 'PM' },
        relative: { future: 'Daqui a %s', past: 'h\u00e1 %s' },
    },
    formats: { time: 'G:i', date: 'j F, Y', datetime: 'j F, Y G:i' },
    timezone: { offset: '0', string: '' },
};

window.userSettings = { uid: 123 };

window.wpEditorL10n = { 
    tinymce: {
        baseUrl: 'node_modules/tinymce',
        settings: {
	    external_plugins: [],
	    plugins: 'charmap,colorpicker,hr,lists,media,paste,tabfocus,textcolor,fullscreen,wordpress,wpautoresize,wpeditimage,wpemoji,wpgallery,wplink,wpdialogs,wptextpattern,wpview',
	    toolbar1: 'formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,kitchensink',
	    toolbar2: 'strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help',
	    toolbar3: '',
	    toolbar4: '',
	},
	suffix: '.min',
    }
};

window.wpApiSettings = {
    root: 'YOUR_ROOT_PATH',
    nonce: '123456789',
    schema: {
    	routes: {
	    "\/wp\/v2\/posts": { methods: [ 'GET' ] },
	    ...
	},
    }

};
```

We are working to include on **Gutenberg by Frontkom** all settings that shouldn't be part of your apps.

### *apiRequest* and *url*

Those two are very important for comunication between the editor and remaining app, so you should set them up accordingly your needs. 

***apiRequest*** is the method that will handle with data operations on Gutenberg, like getting resources (categories for example), saving page changes or deleting pages, etc. It receives an object with `path`, `method`, `data`, etc, so you can treat it as you want.

``` js
function apiRequest( options ) {
    // Do something with those options like calling an API or actions from your store...
}
```

***url*** should has a function called `addQueryArgs( url, args )` that handle with `url` and `args` and returns the final url to different actions. The original implementation is the following, feel free to keep it or change it according to your needs.

``` js
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

``` js
window.customGutenberg = { ... };
```

Important to say that Gutenberg works perfectly without the settings of this object :)

### Block Menu Tabs

You can customize the tabs are displayed on the editor *Add blocks popup*, like as which block categories they should display and how. By default, Gutenberg display `suggested`, `blocks`, `embeds` and `shared` tabs.

``` js
window.customGutenberg = {
    ...
    tabs: [ 
        {
	    options: { name: 'suggested', title: 'Suggested', className: 'editor-inserter__tab' },
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
	    options: { name: 'blocks', title: 'Blocks', className: 'editor-inserter__tab' },
	    tabScrollTop: 0,
	    getItemsForTab() { // rendering blocks from which categories
	        return ( item ) => item.category !== 'embed' && item.category !== 'shared';
	    },
	},
	...
    ],
    ...
}
```

### Block Categories

You can set which block categories and consequently which blocks will be displayed on your editor. By default, Gutenberg has `common`, `formatting`, `layout`, `widgets`, `embed` and `shared` blocks categories.

``` js
window.customGutenberg = {
    ...
    categories: [ 
        { slug: 'common', title: 'Common blocks' }, // this category should allways be included because of the default block (paragraph)
	{ slug: 'formatting', title: 'Formatting' },
	{ slug: 'layout', title: 'Layout Elements' },
	...
    ],
    ...
}
```

### Rows

** Gutenberg by Frontkom ** introduces a new category of blocks: the rows. Rows are divided in columns which you can set up. The total of columns are 12 and it must be the sum of `cols` array items. By default, the rows blocks will be available under the Blocks tab.

``` js
window.customGutenberg = {
    ...
    rows: [
        { cols: [ 6, 6 ], title: 'col6 x 2', description: '2 eq columns layout' },
	{ cols: [ 4, 4, 4 ], title: 'col4 x 3', description: '3 eq columns layout' },
	{ cols: [ 7, 5 ], title: 'col7-col5', description: 'A col7 and a col5' },
	{ cols: [ 2, 8, 2 ], title: 'col2-col8-col2', description: 'A col2, a col8 and a col2' },
    ],
    ....
}
```

### Document Panels

At sidebar there are a few panels that could be customize.

#### Articles Panel

The Articles Panel contains a list of articles which could be filtered by category and/or searched be name and then be added to your page by drag and drop in form of an (Article block)[#article-block] . 

Articles and Categories should follow this structure
``` js
const article = {
    id: 1,
    title: { rendered: 'First article title' },
    date_gmt: '2018-04-01T00:00:00.000Z',
    date: '2018-04-01T00:00:00.000Z',
    category_id: 1,
    image_url: ABSOLUTE_PATH,
};

const category = { id: 1, name: 'Category 1', parent: 0 };
```

To use this panel you should set up those `window.wpApiSettings.schema.routes` and implement their behavior on `window.wp.apiRequest`.

``` js
window.wpApiSettings = { 
    ... ,
    schema: {
        ...,
	routes: {
	    ..., 
	    "\/wp\/v2\/categories": { methods: [ 'GET' ] }, // get all categories
	    "\/wp\/v2\/articles\/(?P<id>[\\d]+)": { methods: [ 'GET' ] }, // get a article by name
	    "\/wp\/v2\/articles": { methods: [ 'GET' ] }, // get all articles
	}
    }
}
```

#### Article Block

The Article Block is another kind of blocks created by **Gutenberg by Frontkom** which is composed by a cover image and a tite.

### Editor Settings

For now, there is only two kinds of settings releated with editor: `hideTitle` and `noMediaLibrary`

``` js
window.customGutenberg = {
    ...
    editor: {
    	hideTitle: true, // to hide page title
	noMediaLibrary: true, // to editor don't expect use a media library
    },
    ....
}
```
