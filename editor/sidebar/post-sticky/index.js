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
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

function PostSticky( { onTogglePostSticky, postType, postSticky = false, instanceId } ) {
	if ( postType !== 'post' ) {
		return false;
	}

	const stickyToggleId = 'post-sticky-toggle-' + instanceId;

	return (
		<div className="editor-post-status__row">
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the front page' ) }</label>
			<FormToggle
				checked={ postSticky }
				onChange={ () => onTogglePostSticky( postSticky ) }
				showHint={ false }
				id={ stickyToggleId }
			/>
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			postType: getEditedPostAttribute( state, 'type' ),
			postSticky: getEditedPostAttribute( state, 'sticky' ),
		};
	},
	( dispatch ) => {
		return {
			onTogglePostSticky( postSticky ) {
				dispatch( editPost( { sticky: ! postSticky } ) );
			},
		};
	},
)( withInstanceId( PostSticky ) );
