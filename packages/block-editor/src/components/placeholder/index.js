/**
 * WordPress dependencies
 */
import { Placeholder } from '@wordpress/components';
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
	withBlockEditContext( ( { isReadOnly } ) => ( { isReadOnly } ) ),
] )( PlaceholderInBlockContext );
