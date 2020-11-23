/**
 * Internal dependencies
 */
import BlockView from './block-view';
import ListView from './list-view';

export default function Editor( { isPending, blocks } ) {
	return (
		<div className="edit-navigation-editor">
			<BlockView isPending={ isPending } />
			<ListView isPending={ isPending } blocks={ blocks } />
		</div>
	);
}
