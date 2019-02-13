/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createSlotFill, withFocusReturn, Animate } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';

const { Fill, Slot } = createSlotFill( 'Sidebar' );

/**
 * Renders a sidebar with its content.
 *
 * @return {Object} The rendered sidebar.
 */
const Sidebar = ( { children, label } ) => {
	return (
		<Fill>
			<Animate type="slide-in" options={ { origin: 'left' } }>
				{ ( { className } ) => (
					<div
						className={ classnames( 'edit-post-sidebar', className ) }
						role="region"
						aria-label={ label }
						tabIndex="-1"
					>
						{ children }
					</div>
				) }
			</Animate>
		</Fill>
	);
};

const WrappedSidebar = compose(
	withSelect( ( select, { name } ) => ( {
		isActive: select( 'core/edit-post' ).getActiveGeneralSidebarName() === name,
	} ) ),
	ifCondition( ( { isActive } ) => isActive ),
	withFocusReturn,
)( Sidebar );

WrappedSidebar.Slot = Slot;

export default WrappedSidebar;
