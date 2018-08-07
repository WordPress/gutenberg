/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostStickyCheck from './check';

export function PostSticky( { onUpdateSticky, postSticky = false } ) {
	return (
		<PostStickyCheck>
			<CheckboxControl
				label={ __( 'Stick to the Front Page' ) }
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
			/>
		</PostStickyCheck>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postSticky: select( 'core/editor' ).getEditedPostAttribute( 'sticky' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onUpdateSticky( postSticky ) {
				dispatch( 'core/editor' ).editPost( { sticky: postSticky } );
			},
		};
	} ),
] )( PostSticky );
