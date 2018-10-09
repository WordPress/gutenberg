/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockSwitcher from './';

export function MultiBlocksSwitcher( { isMultiBlockSelection, selectedBlockClientIds } ) {
	if ( ! isMultiBlockSelection ) {
		return null;
	}
	return (
		<BlockSwitcher key="switcher" clientIds={ selectedBlockClientIds } />
	);
}

export default withSelect(
	( select ) => {
		const selectedBlockClientIds = select( 'core/editor' ).getMultiSelectedBlockClientIds();
		return {
			isMultiBlockSelection: selectedBlockClientIds.length > 1,
			selectedBlockClientIds,
		};
	}
)( MultiBlocksSwitcher );
