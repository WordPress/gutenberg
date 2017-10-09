/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { withFocusReturn } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostSettings from './post-settings';
import BlockInspector from './block-inspector';
import MultiBlockInspector from './multi-block-inspector';
import Header from './header';
import { getActivePanel, getSelectedBlockCount } from '../selectors';

const Sidebar = ( { panel, selectedBlockCount } ) => {
	return (
		<div className="editor-sidebar" role="region" aria-label={ __( 'Editor settings' ) }>
			<Header count={ selectedBlockCount || 1 } />
			{ panel === 'document' && <PostSettings /> }
			{ panel === 'block' && selectedBlockCount === 1 && <BlockInspector /> }
			{ panel === 'block' && selectedBlockCount > 1 && <MultiBlockInspector /> }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			panel: getActivePanel( state ),
			selectedBlockCount: getSelectedBlockCount( state ),
		};
	}
)( withFocusReturn( Sidebar ) );
