/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/element';

function PostHeader( { headerStatus = 'open', instanceId, ...props } ) {
	const onToggleHeader = () => props.editPost( { header_status: headerStatus === 'open' ? 'closed' : 'open' } );

	const headerToggleId = 'allow-header-toggle-' + instanceId;

	return [
		<label key="label" htmlFor={ headerToggleId }>{ __( 'Display header' ) }</label>,
		<FormToggle
			key="toggle"
			checked={ headerStatus === 'open' }
			onChange={ onToggleHeader }
			showHint={ false }
			id={ headerToggleId }
		/>,
	];
}

export default compose( [
	withSelect( ( select ) => {
		return {
			headerStatus: select( 'core/editor' ).getEditedPostAttribute( 'header_status' ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		editPost: dispatch( 'core/editor' ).editPost,
	} ) ),
	withInstanceId,
] )( PostHeader );

