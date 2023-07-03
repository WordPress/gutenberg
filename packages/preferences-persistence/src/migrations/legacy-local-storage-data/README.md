# Legacy local storage migrations

This folder contains all the migration code for converting from the old `data` package persistence system.

## History

Previously, some packages could configure a store to persist particular parts of state. In this example, the post editor is configured to persist the state for its `preferences` reducer to local storage:
```js
registerStore(
	'core/edit-post', {
		selectors,
		actions,
		reducer,
		persist: [ 'preferences' ],
	},
);
```

This would result in local storage data being saved in this format:
```json
{
	"core/edit-post": {
		"preferences": {
			// ... preferences state from the post editor.
		}
	},
	// ... other persisted state from other editors.
}
```

And when an editor was reloaded, this would become the initial store state.

The preferences package was later introduced, and this became a centralized place for managing and persisting preferences for other packages. The job of these migration functions is to migrate data from the old persistence system to the new format for the preferences store:
```json
{
	"preferences": {
		"core/edit-post": {
			// ... preferences for the post editor.
		}
		// ... preferences for other editors
	}
}
