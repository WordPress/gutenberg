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
function Sidebar( { children, label, className } ) {
	return (
		<div
			className={ classnames( 'edit-post-sidebar', className ) }
			role="region"
			aria-label={ label }
			tabIndex="-1"
		>
			{ children }
		</div>
	);
}

Sidebar = withFocusReturn( {
	onFocusReturn() {
		const button = document.querySelector( '.edit-post-header__settings [aria-label="Settings"]' );
		if ( button ) {
			button.focus();
			return false;
		}
	},
} )( Sidebar );

function AnimatedSidebarFill( props ) {
	return (
		<Fill>
			<Animate type="slide-in" options={ { origin: 'left' } }>
				{ () => <Sidebar { ...props } /> }
			</Animate>
		</Fill>
	);
}

const WrappedSidebar = compose(
	withSelect( ( select, { name } ) => ( {
		isActive: select( 'core/edit-post' ).getActiveGeneralSidebarName() === name,
	} ) ),
	ifCondition( ( { isActive } ) => isActive ),
)( AnimatedSidebarFill );

WrappedSidebar.Slot = Slot;

export default WrappedSidebar;
