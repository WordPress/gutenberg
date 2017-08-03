/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute, getCurrentPostType } from '../../selectors';
import { editPost } from '../../actions';

function PostSticky( { onUpdateSticky, postType, postSticky = false, instanceId } ) {
	if ( postType !== 'post' ) {
		return false;
	}

	const stickyToggleId = 'post-sticky-toggle-' + instanceId;

	return (
		<PanelRow>
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the front page' ) }</label>
			<FormToggle
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
				showHint={ false }
				id={ stickyToggleId }
			/>
		</PanelRow>
	);
}

export default connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
			postSticky: getEditedPostAttribute( state, 'sticky' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateSticky( postSticky ) {
				dispatch( editPost( { sticky: postSticky } ) );
			},
		};
	},
)( withInstanceId( PostSticky ) );
