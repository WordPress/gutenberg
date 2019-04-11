/**
 * WordPress dependencies
 */
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import withClientId from './utils/with-client-id';

export const HideWhenChildBlocks = function( props ) {
	return props.children;
};

export default compose( [
	withClientId,
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );

		return {
			hasChildBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
	ifCondition( ( { hasChildBlocks } ) => {
		return ! hasChildBlocks;
	} ),
] )( HideWhenChildBlocks );
