/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { Button, Dashicon } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import PostPublishButtonLabel from '../post-publish-button/label';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
	isCurrentPostPublished,
} from '../../store/selectors';

function PostPublishPanelToggle( { isSaving, isPublishable, isSaveable, isPublished, onToggle, isOpen } ) {
	const isButtonEnabled = (
		! isSaving && isPublishable && isSaveable
	) || isPublished;

	return (
		<Button
			className="editor-post-publish-panel__toggle"
			isPrimary
			onClick={ onToggle }
			aria-expanded={ isOpen }
			disabled={ ! isButtonEnabled }
			isBusy={ isSaving && isPublished }
		>
			<PostPublishButtonLabel />
			<Dashicon icon="arrow-down" />
		</Button>
	);
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		isPublished: isCurrentPostPublished( state ),
	} ),
)( PostPublishPanelToggle );
