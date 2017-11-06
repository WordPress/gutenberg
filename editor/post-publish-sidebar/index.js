/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { FoldableSidebar, PanelHeader, IconButton } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostPublishSettings from '../sidebar/post-publish-settings';
import PublishButton from '../header/publish-button';
import { getActivePanel } from '../selectors';
import { setActivePanel } from '../actions';

const BlockInspectorSidebar = ( { panel, onClose } ) => {
	if ( panel !== 'publish' ) {
		return null;
	}

	return (
		<FoldableSidebar
			className="editor-post-publish-sidebar"
			role="region"
			aria-label={ __( 'Post Publish' ) }
			tabIndex="-1"
		>
			<PanelHeader>
				<PublishButton onSubmit={ onClose } />
				<IconButton
					className="editor-post-publish-sidebar__close"
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</PanelHeader>
			<PostPublishSettings />
		</FoldableSidebar>
	);
};

export default connect(
	( state ) => {
		return {
			panel: getActivePanel( state ),
		};
	},
	{
		onClose: () => setActivePanel( null ),
	}
)( ( BlockInspectorSidebar ) );
