# AutosaveMonitor

`AutosaveMonitor` monitors the changes made to the edited post and triggers an autosave when there is something new to save. The post is checked on an interval, which defaults to the editor's `autosaveInterval` setting and saves to the server via the editor store's `autosave` action. Both the interval and the save callback can be overridden with props.

It also creates the `autosave-exists` warning notice when the server already holds an autosave more recent than the loaded post. This notice therefore only appears where `AutosaveMonitor` is rendered (and where the post type supports `autosave`). An editor that receives `settings.autosave` but does not render `AutosaveMonitor` will not surface this warning.

## Example

```js
const MyLayout = () => (
	<main>
		<AutosaveMonitor interval={ 30 } />
		<MyEditor />
	</main>
);
```

# LocalAutosaveMonitor

`LocalAutosaveMonitor` is a component based on `AutosaveMonitor` that ensures that a local copy of the current post is regularly saved in `sessionStorage`. Additionally, it will:

-   attempt to clear the local copy if a copy is successful saved on the server;
-   warn the user upon loading a post that there is a local copy that can be loaded;
-   defer to remote autosaves, if any is available.

`LocalAutosaveMonitor` observes a saving interval defined specifically for local autosaves, in contrast with remote (server-side) autosaving.

The interval used for the local autosave can be modified by updating the editor settings
```js
wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
	localAutosaveInterval: 100000000000,
} );
```

## Example

```js
const MyLayout = () => (
	<main>
		<LocalAutosaveMonitor />
		<MyEditor />
	</main>
);
```
