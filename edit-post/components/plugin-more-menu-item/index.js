/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/element';
import { Slot, Fill, withContext, MenuItemsItem, composeIfCondition } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Name of slot in which the more menu items should fill.
 *
 * @type {string}
 */
export const SLOT_NAME = 'PluginMoreMenuItem';

let PluginMoreMenuItem = ( { label, onClick, icon, isSelected } ) => (
	<Fill name={ SLOT_NAME }>
		{ ( props ) => {
			return (
				<MenuItemsItem
					icon={ isSelected ? 'yes' : icon }
					isSelected={ isSelected }
					label={ label }
					onClick={ () => {
						onClick();
						props.onClose();
					} }
				/>
			);
		} }
	</Fill>
);

PluginMoreMenuItem = compose( [
	withContext( 'pluginName' )( ( pluginName, { target } ) => {
		return {
			target: `${ pluginName }/${ target }`,
		};
	} ),
	composeIfCondition( props => props.type === 'sidebar', [
		withSelect( ( select, ownProps ) => {
			const { target } = ownProps;
			return {
				isSelected: select( 'core/edit-post' ).getActiveGeneralSidebarName() === target,
			};
		} ),
		withDispatch( ( dispatch, ownProps ) => {
			const { target, isSelected } = ownProps;
			let onClick;
			const {
				closeGeneralSidebar,
				openGeneralSidebar,
			} = dispatch( 'core/edit-post' );
			if ( isSelected ) {
				onClick = closeGeneralSidebar;
			} else {
				onClick = () => openGeneralSidebar( target );
			}
			return {
				onClick,
			};
		} ),
	] ),
] )( PluginMoreMenuItem );

PluginMoreMenuItem.Slot = ( { fillProps } ) => (
	<Slot name={ SLOT_NAME } fillProps={ fillProps } />
);

export default PluginMoreMenuItem;
