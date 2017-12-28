/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import PublishButtonLabel from './label';
import { editPost, savePost } from '../../store/actions';
import {
	isSavingPost,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
	isEditedPostSaveable,
	isEditedPostPublishable,
	getCurrentPostType,
} from '../../store/selectors';

export function PostPublishButton( {
	isSaving,
	onStatusChange,
	onSave,
	isBeingScheduled,
	visibility,
	isPublishable,
	isSaveable,
	user,
	onSubmit = noop,
} ) {
	const isButtonEnabled = user.data && ! isSaving && isPublishable && isSaveable;
	const isContributor = ! get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	let publishStatus;
	if ( isContributor ) {
		publishStatus = 'pending';
	} else if ( isBeingScheduled ) {
		publishStatus = 'future';
	} else if ( visibility === 'private' ) {
		publishStatus = 'private';
	} else {
		publishStatus = 'publish';
	}

	const className = classnames( 'editor-post-publish-button', {
		'is-saving': isSaving,
	} );

	const onClick = () => {
		onSubmit();
		onStatusChange( publishStatus );
		onSave();
	};

	return (
		<Button
			isPrimary
			isLarge
			onClick={ onClick }
			disabled={ ! isButtonEnabled }
			className={ className }
		>
			<PublishButtonLabel />
		</Button>
	);
}

const applyConnect = connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isBeingScheduled: isEditedPostBeingScheduled( state ),
		visibility: getEditedPostVisibility( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		postType: getCurrentPostType( state ),
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostPublishButton );
