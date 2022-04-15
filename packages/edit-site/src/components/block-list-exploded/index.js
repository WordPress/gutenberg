/**
 * WordPress dependencies
 */
import { store as blockEditorStore, Inserter } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockListExplodedItem from './item';

const InserterBeforeBlock = pure( ( { clientId } ) => (
	<div className="edit-site-block-list-exploded__inserter" key={ clientId }>
		<Inserter clientId={ clientId } __experimentalIsQuick isPrimary />
	</div>
) );

function BlockListExploded() {
	const blockOrder = useSelect( ( select ) => {
		return select( blockEditorStore ).getBlockOrder();
	}, [] );

	return (
		<div className="edit-site-block-list-exploded">
			{ blockOrder.map( ( clientId ) => (
				<div key={ clientId }>
					<InserterBeforeBlock clientId={ clientId } />
					<BlockListExplodedItem clientId={ clientId } />
				</div>
			) ) }
			<InserterBeforeBlock />
		</div>
	);
}

export default BlockListExploded;
