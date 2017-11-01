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
import PostSettings from '../sidebar/post-settings';

import { getActivePanel } from '../selectors';
import { setActivePanel } from '../actions';

const PostSettingsSidebar = ( { panel, onClose } ) => {
	if ( panel !== 'document' ) {
		return null;
	}

	return (
		<FoldableSidebar
			className="editor-post-settings-sidebar"
			role="region"
			aria-label={ __( 'Editor settings' ) }
			tabIndex="-1"
		>
			<PanelHeader label={ __( 'Document settings' ) }>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</PanelHeader>
			<PostSettings />
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
)( ( PostSettingsSidebar ) );
