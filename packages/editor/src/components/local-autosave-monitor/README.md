# LocalAutosaveMonitor

`LocalAutosaveMonitor` is a component based on `AutosaveMonitor` that ensures that a local copy of the current post is regularly saved in `sessionStorage`. Additionally, it will:

-   attempt to clear the local copy if a copy is successful saved on the server;
-   warn the user upon loading a post that there is a local copy that can be loaded;
-   defer to remote autosaves, if any is available.

`LocalAutosaveMonitor` observes a saving interval defined specifically for local autosaves, in contrast with remote (server-side) autosaving. See the preference `localAutosaveInterval`.

## Example

```js
const MyLayout = () => (
	<main>
		<LocalAutosaveMonitor />
		<MyEditor />
	</main>
);
```
