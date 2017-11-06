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
import BlockInspector from '../sidebar/block-inspector';

import { getActivePanel } from '../selectors';
import { setActivePanel } from '../actions';

const BlockInspectorSidebar = ( { panel, onClose } ) => {
	if ( panel !== 'block' ) {
		return null;
	}

	return (
		<FoldableSidebar
			className="editor-block-inspector-sidebar"
			role="region"
			aria-label={ __( 'Block settings' ) }
			tabIndex="-1"
		>
			<PanelHeader label={ __( 'Block settings' ) }>
				<IconButton
					onClick={ onClose }
					icon="no-alt"
					label={ __( 'Close settings' ) }
				/>
			</PanelHeader>
			<BlockInspector />
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
