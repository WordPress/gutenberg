/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

function findNavigationBlock( blocks, refId ) {
	for ( const block of blocks ) {
		if (
			block.name === 'core/navigation' &&
			block.attributes.ref === refId
		) {
			return block;
		}
		if ( block.innerBlocks?.length ) {
			const found = findNavigationBlock( block.innerBlocks, refId );
			if ( found ) {
				return found;
			}
		}
	}
	return null;
}

export default function useAutoSelectNavigationBlock() {
	const { navigationRef } = useLocation().query;
	const { selectBlock } = useDispatch( blockEditorStore );
	const blocks = useSelect(
		( select ) => select( blockEditorStore ).getBlocks(),
		[]
	);

	useEffect( () => {
		if ( ! navigationRef || ! blocks.length ) {
			return;
		}
		const refId = Number( navigationRef );
		const navBlock = findNavigationBlock( blocks, refId );
		if ( navBlock ) {
			selectBlock( navBlock.clientId );
		}
	}, [ navigationRef, blocks, selectBlock ] );
}
