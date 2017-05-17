/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import Panel from 'components/panel';
import PanelHeader from 'components/panel/header';
import PanelBody from 'components/panel/body';

/**
 * Internal Dependencies
 */
import PostSettings from './post-settings';
import './style.scss';

const Sidebar = () => {
	const header = (
		<strong>
			<span className="editor-sidebar__select-post">Post</span> → Block
		</strong>
	);

	return (
		<div className="editor-sidebar">
			<PostSettings />
			<Panel>
				<PanelHeader label={ header } />
				<PanelBody>
					<Slot name="Sidebar.Inspector" />
				</PanelBody>
			</Panel>
		</div>
	);
};

export default Sidebar;
