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
import BlockInspectorPanel from './block-inspector-panel';
import Header from './header';

import { getActivePanel } from '../../store/selectors';

const Sidebar = ( { panel } ) => {
	return (
		<div
			className="edit-post-sidebar"
			role="region"
			aria-label={ __( 'Editor advanced settings' ) }
			tabIndex="-1"
		>
			<Header />
			{ panel === 'document' && <PostSettings /> }
			{ panel === 'block' && <BlockInspectorPanel /> }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			panel: getActivePanel( state ),
		};
	},
	undefined,
	undefined,
	{ storeKey: 'edit-post' }
)( withFocusReturn( Sidebar ) );
