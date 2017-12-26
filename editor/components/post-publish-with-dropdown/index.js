/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { Dropdown, Button, Dashicon } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostPublishButtonLabel from '../post-publish-button/label';
import PostPublishDropdown from '../post-publish-dropdown';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
	isCurrentPostPublished,
	isAutosavingPost,
} from '../../store/selectors';

function PostPublishWithDropdown( { isSaving, isPublishable, isSaveable, isPublished, isAutosaving } ) {

	const isButtonEnabled =
		(
			(
				! isSaving &&
				isPublishable &&
				isSaveable
			) || isPublished
		) &&
		! isAutosaving;

	return (
		<Dropdown
			position="bottom left"
			className="editor-post-publish-with-dropdown"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className="editor-post-publish-with-dropdown__button"
					isPrimary
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ ! isButtonEnabled }
					isBusy={ isSaving && isPublished && ! isAutosaving }
				>
					<PostPublishButtonLabel />
					<Dashicon icon="arrow-down" />
				</Button>
			) }
			renderContent={ ( { onClose } ) => <PostPublishDropdown onSubmit={ onClose } /> }
		/>
	);
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		isPublished: isCurrentPostPublished( state ),
		isAutosaving: isAutosavingPost( state ),
	} ),
)( PostPublishWithDropdown );
