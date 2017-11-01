/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PublishButtonLabel from '../publish-button/label';
import {
	isSavingPost,
	isEditedPostSaveable,
	isEditedPostPublishable,
	getActivePanel,
} from '../../selectors';
import { setActivePanel } from '../../actions';

function PublishToggle( { panel, isSaving, isPublishable, isSaveable, closeSidebar, showPublishSidebar } ) {
	const isButtonEnabled = ! isSaving && isPublishable && isSaveable;
	const isOpen = panel === 'publish';

	return (
		<Button
			className="editor-publish-toggle"
			isPrimary
			isLarge
			onClick={ isOpen ? closeSidebar : showPublishSidebar }
			aria-expanded={ isOpen }
			disabled={ ! isButtonEnabled }
		>
			<PublishButtonLabel />
			...
		</Button>
	);
}

export default connect(
	( state ) => ( {
		isSaving: isSavingPost( state ),
		isSaveable: isEditedPostSaveable( state ),
		isPublishable: isEditedPostPublishable( state ),
		panel: getActivePanel( state ),
	} ),
	{
		closeSidebar: () => setActivePanel( null ),
		showPublishSidebar: () => setActivePanel( 'publish' ),
	}
)( PublishToggle );
