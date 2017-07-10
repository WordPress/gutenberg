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
import { getSelectedBlock, getActivePanel } from '../selectors';

const Sidebar = ( { selectedBlock, panel } ) => {
	return (
		<div className="editor-sidebar">
			<Header />
			{ panel === 'document' && <PostSettings /> }
			{ panel === 'block' && <BlockInspector /> }
		</div>
	);
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			panel: getActivePanel( state ),
		};
	}
)( withFocusReturn( Sidebar ) );
