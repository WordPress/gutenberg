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
} from '../../selectors';

function PostPublishWithDropdown( { isSaving, isPublishable, isSaveable } ) {
	const isButtonEnabled = ! isSaving && isPublishable && isSaveable;

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
	} ),
	undefined,
	undefined,
	{ storeKey: 'editorStore' }
)( PostPublishWithDropdown );
