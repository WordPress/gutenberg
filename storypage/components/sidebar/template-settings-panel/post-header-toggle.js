/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, Fragment } from '@wordpress/element';

function PostHeaderToggle( { onToggleHeader, hasHeader = false, instanceId } ) {
	const headerToggleId = 'header-toggle-' + instanceId;

	return (
		<Fragment>
			<label htmlFor={ headerToggleId }>{ __( 'Display header' ) }</label>
			<FormToggle
				key="toggle"
				checked={ hasHeader }
				onChange={ () => onToggleHeader( ! hasHeader ) }
				id={ headerToggleId }
			/>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			hasHeader: select( 'core/editor' ).getEditedPostAttribute( 'header' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onToggleHeader( hasHeader ) {
				dispatch( 'core/editor' ).editPost( { header: hasHeader } );
			},
		};
	} ),
	withInstanceId,
] )( PostHeaderToggle );

