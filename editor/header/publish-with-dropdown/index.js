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
import { PostPublishButtonLabel } from '../../components';
import PublishDropdown from '../publish-dropdown';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
} from '../../state/selectors';

function PublishWithDropdown( { isSaving, isPublishable, isSaveable } ) {
	const isButtonEnabled = ! isSaving && isPublishable && isSaveable;

	return (
		<Dropdown
			position="bottom left"
			className="editor-publish-with-dropdown"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					className="editor-publish-with-dropdown__button"
					isPrimary
					onClick={ onToggle }
					aria-expanded={ isOpen }
					disabled={ ! isButtonEnabled }
				>
					<PostPublishButtonLabel />
					<Dashicon icon="arrow-down" />
				</Button>
			) }
			renderContent={ ( { onClose } ) => <PublishDropdown onSubmit={ onClose } /> }
		/>
	);
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
	} ),
)( PublishWithDropdown );
