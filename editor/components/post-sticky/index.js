/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { withInstanceId, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostStickyCheck from './check';

export function PostSticky( { onUpdateSticky, postSticky = false, instanceId } ) {
	const stickyToggleId = 'post-sticky-toggle-' + instanceId;

	return (
		<PostStickyCheck>
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the Front Page' ) }</label>
			<FormToggle
				key="toggle"
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
				id={ stickyToggleId }
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
	withInstanceId,
] )( PostSticky );
