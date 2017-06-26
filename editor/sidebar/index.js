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

const sidebar = (
	<div className="editor-sidebar">
		<BlockInspector />
		<PostSettings />
	</div>
);

export default withFocusReturn( () => sidebar );
