# PluginPostRevisionInfo

This slot inserts items in the visual revisions document sidebar, under the revision post card. Fill function children receive `{ context }`. `context.revision` is `null` while the revision record is loading.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginPostRevisionInfo } from '@wordpress/editor';

const PluginPostRevisionInfoTest = () => (
	<PluginPostRevisionInfo>
		{ ( { context } ) => <p>Revision { context.revisionId }</p> }
	</PluginPostRevisionInfo>
);

registerPlugin( 'post-revision-info-test', {
	render: PluginPostRevisionInfoTest,
} );
```
