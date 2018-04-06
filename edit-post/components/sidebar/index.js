/**
 * WordPress Dependencies
 */
import { createSlotFill, ifCondition, withFocusReturn } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';

const SidebarFill = createSlotFill( 'editPost.Sidebar' );

/**
 * Renders a sidebar with its content.
 *
 * @return {Object} The rendered sidebar.
 */
const Sidebar = ( { children, label } ) => {
	return (
		<SidebarFill>
			<div
				className="edit-post-sidebar"
				role="region"
				aria-label={ label }
				tabIndex="-1"
			>
				{ children }
			</div>
		</SidebarFill>
	);
};

const WrappedSidebar = compose(
	withSelect( ( select ) => ( {
		activeSidebarName: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
	} ) ),
	ifCondition( ( { activeSidebarName, name } ) => activeSidebarName === name ),
	withFocusReturn,
)( Sidebar );

WrappedSidebar.Slot = SidebarFill.Slot;

export default WrappedSidebar;
