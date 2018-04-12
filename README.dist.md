# Gutenberg by Front

We make [Gutenberg](https://github.com/front/gutenberg) editor a little more customizable... Gutenberg editor could be use in your apps and you can customize things like which tabs and blocks categories or document panels to show and more! 

## Usage

We've tried to make it easy to import Gutenberg editor in our apps:
```
// regitering core blocks
import { registerCoreBlocks } from '@frontkom/gutenberg';
```

and 

```
// initializing the editor
import { initializeEditor } from '@frontkom/gutenberg';

// don't forget to import Gutenberg style
import '@frontkom/gutenberg/dist/blocks/style.css';
import '@frontkom/gutenberg/dist/blocks/edit-blocks.css';
import '@frontkom/gutenberg/dist/style.css';

const target = 'editor'; // DOM element id where editor will be display

const post = { 
	content: { raw: '' },
	templates: '',
	title: { raw: 'My first post' },
	type: 'post',
	id: 12345,
	...
};

const settings = { 
	alignWide: false,
	availableTemplates: [],
	disableCustomColors: false,
	titlePlaceholder: 'Add a title here...',
	...
};

// Et voilá...
initializeEditor( target, post, settings );
```


## Global variables 

Gutenberg depends on several global variables: `wp`, `wpApiSettings`, `_wpDateSettings`, `userSettings`, `wpEditorL10n`. If you don't set them up, you'll see Gutenberg editor won't run.

## customGutenberg global

Follwing the same logic, we've created the `customGutenberg` global object where you can set eveything that we made customizable on Gutenberg.

```
window.customGutenberg = { ... };
```

Important to say that Gutenberg works perfectly without the settings of this object :)

### Categories
```
window.customGutenberg = {
	...
	categories: [ 
		{ slug: 'common', title: 'Common blocks' } // this category should allways be included
	],
	...
```

### Rows

### Tabs

### Panel

### Editor

## Instalation

Gutenberg by Frontkom is available through npm:

```sh
npm install @frontkom/gutenberg
```

