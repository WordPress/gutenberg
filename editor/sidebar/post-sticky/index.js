/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, FormToggle, withInstanceId, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute, getCurrentPostType } from '../../selectors';
import { editPost } from '../../actions';

export function PostSticky( { onUpdateSticky, postType, postSticky = false, instanceId, user } ) {
	if (
		postType !== 'post' ||
		! user.data ||
		! user.data.capabilities.publish_posts ||
		! user.data.capabilities.edit_others_posts
	) {
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

const applyConnect = connect(
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
);

const applyWithAPIData = withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} );

export default flowRight( [
	applyConnect,
	applyWithAPIData,
	withInstanceId,
] )( PostSticky );
