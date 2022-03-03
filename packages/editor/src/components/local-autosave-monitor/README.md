# LocalAutosaveMonitor

`LocalAutosaveMonitor` is a component based on `AutosaveMonitor` that ensures that a local copy of the current post is regularly saved in `sessionStorage`. Additionally, it will:

-   attempt to clear the local copy if a copy is successful saved on the server;
-   warn the user upon loading a post that there is a local copy that can be loaded;
-   defer to remote autosaves, if any is available.

`LocalAutosaveMonitor` observes a saving interval defined specifically for local autosaves, in contrast with remote (server-side) autosaving.

The interval used for the local autosave can be modified using the preferences store:
```js
// Set the interval.
wp.data.dispatch( 'core/preferences' ).set( 'core/edit-post', 'localAutosaveInterval', 100 );

// Get the interval.
wp.data.select( 'core/preferences' ).get( 'core/edit-post', 'localAutosaveInterval' ); // 100
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
