# LocalAutosaveMonitor

`LocalAutosaveMonitor` keeps a backup of the current post in `sessionStorage`. It writes the backup every `localAutosaveInterval` seconds and when the page is hidden or unloaded, and clears it once a save covers it.

The editor already backs up the post it edits and offers to restore the backup, so render `LocalAutosaveMonitor` only in a custom editor.

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
