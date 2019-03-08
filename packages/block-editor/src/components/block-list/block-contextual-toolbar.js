/**
 * Internal dependencies
 */
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount } ) {
	return (
		<div className="editor-block-contextual-toolbar">
			<BlockToolbar focusOnMount={ focusOnMount } />
		</div>
	);
}

export default BlockContextualToolbar;
