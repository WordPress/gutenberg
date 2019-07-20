/**
 * WordPress dependencies
 */
import { Placeholder } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

export default compose( [
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const rootClientId = getBlockRootClientId( clientId );
		const isReadOnly = getTemplateLock( rootClientId ).has( 'attributes' );
		return { isReadOnly };
	} ),
	ifCondition( ( { isReadOnly } ) => ! isReadOnly ),
] )( Placeholder );
