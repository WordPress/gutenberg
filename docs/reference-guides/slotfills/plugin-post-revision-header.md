# PluginPostRevisionHeader

This slot inserts items in the visual revisions header settings cluster, after Settings and before Exit. Fill function children receive `{ context }`. `context.revision` is `null` while the revision record is loading. The `context` object is the same shape as [`PluginPostRevisionInfo`](/docs/reference-guides/slotfills/plugin-post-revision-info.md).

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostRevisionHeader } from '@wordpress/editor';

const PluginPostRevisionHeaderTest = () => (
	<PluginPostRevisionHeader>
		{ ( { context } ) => <p>Revision { context.revisionId }</p> }
	</PluginPostRevisionHeader>
);

registerPlugin( 'post-revision-header-test', {
	render: PluginPostRevisionHeaderTest,
} );
```
