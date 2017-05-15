/**
 * External dependencies
 */
import { Slot } from 'react-slot-fill';

/**
 * Internal Dependencies
 */
import './style.scss';

const Sidebar = () => {
	return (
		<div className="editor-sidebar">
			<div className="editor-sidebar__header">
				<span className="editor-sidebar__select-post">Post</span> → Block
			</div>
			<div className="editor-sidebar__content">
				<Slot name="Sidebar.Inspector" />
			</div>
		</div>
	);
};

export default Sidebar;
