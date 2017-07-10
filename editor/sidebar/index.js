/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { withFocusReturn } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostSettings from './post-settings';
import BlockInspector from './block-inspector';
import Header from './header';
import { getSelectedBlock, getSidebarMode } from '../selectors';

const Sidebar = ( { selectedBlock, sidebarMode } ) => {
	return (
		<div className="editor-sidebar">
			<Header />
			{ sidebarMode === 'document' && <PostSettings /> }
			{ sidebarMode === 'block' && <BlockInspector /> }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			sidebarMode: getSidebarMode( state ),
		};
	}
)( withFocusReturn( Sidebar ) );
