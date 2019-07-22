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
	if ( isReadOnly ) {
		return null;
	}

	delete props.clientId;

	return <Placeholder { ...props } />;
}

export default compose( [
	withBlockEditContext( ( { clientId, isReadOnly } ) => ( { clientId, isReadOnly } ) ),
	withSelect( ( select, { clientId, isReadOnly } ) => {
		const {
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const rootClientId = getBlockRootClientId( clientId );
		const templateLock = getTemplateLock( rootClientId );

		return {
			isReadOnly: isReadOnly === undefined ? templateLock === 'readonly' : isReadOnly,
		};
	} ),
] )( PlaceholderInBlockContext );
