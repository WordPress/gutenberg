/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, Fragment } from '@wordpress/element';

function PostFooterToggle( { onToggleFooter, hasFooter = false, instanceId } ) {
	const footerToggleId = 'footer-toggle-' + instanceId;

	return (
		<Fragment>
			<label htmlFor={ footerToggleId }>{ __( 'Display footer' ) }</label>
			<FormToggle
				key="toggle"
				checked={ hasFooter }
				onChange={ () => onToggleFooter( ! hasFooter ) }
				id={ footerToggleId }
			/>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select ) => {
		return {
			hasFooter: select( 'core/editor' ).getEditedPostAttribute( 'footer' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onToggleFooter( hasFooter ) {
				dispatch( 'core/editor' ).editPost( { footer: hasFooter } );
			},
		};
	} ),
	withInstanceId,
] )( PostFooterToggle );

