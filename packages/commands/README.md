# Commands

Commands is a generic package that allows registering and modifying commands to be displayed using the commands menu, also called the Command Palette. The Command Palette can be accessed in the Editor using `cmd+k`.

## Types of commands

There are two ways to register commands: static or dynamic. Both methods receive a command object as an argument, which provides:

-   `name`: A unique machine-readable name for the command
-   `label`: A human-readable label
-   `icon`: An SVG icon
-   `callback`: A callback function that is called when the command is selected
-   `category`: (Optional) The category of the command. See [Command categories](#command-categories) below
-   `context`: (Optional) The context of the command
-   `keywords`: (Optional) An array of keywords for search matching

### Static commands

Static commands can be registered using the `wp.data.dispatch( wp.commands.store ).registerCommand` action or using the `wp.commands.useCommand` React hook. Static commands are commonly used to perform a specific action. These could include adding a new page or opening a section of the Editor interface, such as opening the Editor Preferences modal. See the `useCommand` [code example](#usecommand) below.

### Dynamic commands

Dynamic commands, on the other hand, are registered using “command loaders", `wp.commands.useCommandLoader`. These loaders are needed when the command list depends on a search term entered by the user in the Command Palette input or when some commands are only available when some conditions are met.

For example, when a user types "contact", the Command Palette needs to filter the available pages using that input to try and find the Contact page. See the `useCommandLoader` [code example](#usecommandloader) below.

## Contextual commands

Static and dynamic commands can be contextual. This means that in a given context (for example, when navigating the Site Editor or editing a template), some specific commands are given more priority and are visible as soon as you open the Command Palette. Also, when typing the Command Palette, these contextual commands are shown above the rest of the commands.

At the moment, three contexts have been implemented:

-   `site-editor`: This is the context that is set when you are navigating in the site editor (sidebar visible).
-   `entity-edit`: This is the context that is set when you are editing a document (template, template part or page).
-   `block-selection-edit`: This is the context that is set when a block is selected.

As the usage of the Command Palette expands, more contexts will be added.

Attaching a command or command loader to a given context is as simple as adding the `context` property (with the right context value from the available contexts above) to the `useCommand` or `useCommandLoader` calls.

## Command categories

Each command can be assigned a `category` that describes what kind of action it performs. Categories are used by the Command Palette to visually differentiate commands. The following categories are available:

-   `command`: Executes code or toggles a command (e.g., Add block, duplicating a block).
-   `view`: Navigates to an area in the admin or opens a panel (e.g., "Go to: Templates").
-   `edit`: Navigates to edit a document (e.g., editing a template, editing a page).
-   `action`: A generic fallback for commands that don't fit the other categories. This is also the default when an invalid category is provided.

If no `category` is specified, the command will have `action` set. If an invalid value is provided, a warning is emitted in development mode and the category defaults to `action`.

## WordPress Data API

The Command Palette also offers a number of [selectors and actions](https://developer.wordpress.org/block-editor/reference-guides/data/data-core-commands/) to manipulate its state, which include:

-   Retrieving the registered commands and command loaders using the following selectors `getCommands` and `getCommandLoader`
-   Checking if the Command Palette is open using the `isOpen` selector.
-   Programmatically open or close the Command Palette using the `open` and `close` actions.

See the [Commands Data](https://developer.wordpress.org/block-editor/reference-guides/data/data-core-commands/) documentation for more information.

## Installation

Install the module

```bash
npm install @wordpress/commands --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

_This package requires the following stylesheets to be included for proper styling:_

```css
/* From node_modules: */
@import '@wordpress/components/build-style/style.css';
@import '@wordpress/commands/build-style/style.css';
```

## API

<!-- START TOKEN(Autogenerated API docs) -->

### store

Store definition for the commands namespace.

_Related_

-   <https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore>

_Usage_

```js
import { store as commandsStore } from '@wordpress/commands';
import { useDispatch } from '@wordpress/data';
...
const { open: openCommandCenter } = useDispatch( commandsStore );
```

_Type_

-   `Object`

### useCommand

Attach a command to the command palette. Used for static commands.

_Usage_

```js
import { useCommand } from '@wordpress/commands';
import { plus } from '@wordpress/icons';

useCommand( {
	name: 'myplugin/my-command-name',
	label: __( 'Add new post' ),
	icon: plus,
	category: 'command',
	callback: ( { close } ) => {
		document.location.href = 'post-new.php';
		close();
	},
} );
```

_Parameters_

-   _command_ `import('../store/actions').WPCommandConfig`: command config.

### useCommandLoader

Attach a command loader to the command palette. Used for dynamic commands.

_Usage_

```js
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useCommandLoader } from '@wordpress/commands';
import { page } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

function usePageSearchCommandLoader( { search } ) {
	// Retrieve the pages for the "search" term.
	const { records, isLoading } = useSelect(
		( select ) => {
			const { getEntityRecords } = select( coreStore );
			const query = {
				search: !! search ? search : undefined,
				per_page: 10,
				orderby: search ? 'relevance' : 'date',
			};
			return {
				records: getEntityRecords( 'postType', 'page', query ),
				isLoading: ! select( coreStore ).hasFinishedResolution(
					'getEntityRecords',
					[ 'postType', 'page', query ]
				),
			};
		},
		[ search ]
	);

	// Create the commands.
	const commands = useMemo( () => {
		return ( records ?? [] ).slice( 0, 10 ).map( ( record ) => {
			return {
				name: record.title?.rendered + ' ' + record.id,
				label: record.title?.rendered
					? record.title?.rendered
					: __( '(no title)' ),
				icon: page,
				category: 'edit',
				callback: ( { close } ) => {
					const args = {
						p: '/page',
						postId: record.id,
					};
					document.location = addQueryArgs( 'site-editor.php', args );
					close();
				},
			};
		} );
	}, [ records ] );

	return {
		commands,
		isLoading,
	};
}

useCommandLoader( {
	name: 'myplugin/page-search',
	hook: usePageSearchCommandLoader,
} );
```

_Parameters_

-   _loader_ `import('../store/actions').WPCommandLoaderConfig`: command loader config.

### useCommands

Attach multiple commands to the command palette. Used for static commands.

_Usage_

```js
import { useCommands } from '@wordpress/commands';
import { plus, pencil } from '@wordpress/icons';

useCommands( [
	{
		name: 'myplugin/add-post',
		label: __( 'Add new post' ),
		icon: plus,
		category: 'command',
		callback: ( { close } ) => {
			document.location.href = 'post-new.php';
			close();
		},
	},
	{
		name: 'myplugin/edit-posts',
		label: __( 'Edit posts' ),
		icon: pencil,
		category: 'view',
		callback: ( { close } ) => {
			document.location.href = 'edit.php';
			close();
		},
	},
] );
```

_Parameters_

-   _commands_ `import('../store/actions').WPCommandConfig[]`: Array of command configs.

<!-- END TOKEN(Autogenerated API docs) -->

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
