/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { noop } from 'lodash';

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
import { editPost, savePost } from '../../actions';
import {
	isSavingPost,
	isEditedPostBeingScheduled,
	getEditedPostVisibility,
	isEditedPostSaveable,
	isEditedPostPublishable,
} from '../../selectors';

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
	const userCaps = user.data ?
		{ ...user.data.capabilities, ...user.data.post_type_capabilities } :
		{ publish_posts: false };
	const isContributor = ! userCaps.publish_posts;

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
	} ),
	{
		onStatusChange: ( status ) => editPost( { status } ),
		onSave: savePost,
	}
);

const applyWithAPIData = withAPIData( () => {
	const postTypeSlug = window._wpGutenbergPost.type;

	return {
		user: `/wp/v2/users/me?post_type=${ postTypeSlug }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostPublishButton );
