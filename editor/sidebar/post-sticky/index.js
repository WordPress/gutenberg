/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { FormToggle, withInstanceId } from 'components';

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
		<div className="editor-post-status__row">
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the front page' ) }</label>
			<FormToggle
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
				showHint={ false }
				id={ stickyToggleId }
			/>
		</div>
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
