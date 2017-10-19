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
import Header from './header';

import { getActivePanel } from '../selectors';

const Sidebar = ( { panel } ) => {
	return (
		<div className="editor-sidebar" role="region" aria-label={ __( 'Editor settings' ) }>
			<Header />
			{ panel === 'document' && <PostSettings key="settings" /> }
			{ panel === 'block' && <BlockInspector /> }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			panel: getActivePanel( state ),
		};
	}
)( withFocusReturn( Sidebar ) );
