/**
 * Internal dependencies
 */
import BlockView from './block-view';

export default function Editor( { isPending } ) {
	return (
		<div className="edit-navigation-editor">
			<BlockView isPending={ isPending } />
		</div>
	);
}
