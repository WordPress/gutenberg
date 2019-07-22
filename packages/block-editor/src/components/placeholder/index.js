/**
 * WordPress dependencies
 */
import { Placeholder } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

function PlaceholderInBlockContext( { isReadOnly, ...props } ) {
	if ( ! isReadOnly ) {
		return null;
	}

	delete props.clientId;

	return <Placeholder { ...props } />;
}

export default compose( [
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const rootClientId = getBlockRootClientId( clientId );
		const isReadOnly = getTemplateLock( rootClientId ) === 'readonly';
		return { isReadOnly };
	} ),
] )( PlaceholderInBlockContext );
