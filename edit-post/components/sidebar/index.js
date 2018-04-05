/**
 * WordPress Dependencies
 */
import { ifCondition, withFocusReturn } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/element';

/**
 * Internal Dependencies
 */
import './style.scss';

/**
 * Renders a sidebar with its content.
 *
 * @return {Object} The rendered sidebar.
 */
const Sidebar = ( { children, label } ) => {
	return (
		<div
			className="edit-post-sidebar"
			role="region"
			aria-label={ label }
			tabIndex="-1"
		>
			{ children }
		</div>
	);
};

export default compose(
	withSelect( ( select ) => ( {
		activeSidebarName: select( 'core/edit-post' ).getActiveGeneralSidebarName(),
	} ) ),
	ifCondition( ( { activeSidebarName, name } ) => activeSidebarName === name ),
	withFocusReturn,
)( Sidebar );
