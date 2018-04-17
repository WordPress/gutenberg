/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

function PostFooter( { footerStatus = 'open', instanceId, ...props } ) {
	const onToggleFooter = () => props.editPost( { footer_status: footerStatus === 'open' ? 'closed' : 'open' } );

	const footerToggleId = 'allow-footer-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ footerToggleId }>{ __( 'Display footer' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ footerStatus === 'open' }
			onChange={ onToggleFooter }
			showHint={ false }
			id={ footerToggleId }
		/>,
	];
}

export default compose( [
	withSelect( ( select ) => {
		return {
			footerStatus: select( 'core/editor' ).getEditedPostAttribute( 'footer_status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( 'core/editor' ).editPost,
	} ) ),
	withInstanceId,
] )( PostFooter );

