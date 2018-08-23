/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockListLayout from './layout';

// TODO: This should be refactored to flatten BlockListLayout into this file.
export default withSelect( ( select, ownProps ) => {
	const { getBlockOrder } = select( 'core/editor' );

	return {
		blockClientIds: getBlockOrder( ownProps.rootClientId ),
	};
} )( BlockListLayout );
