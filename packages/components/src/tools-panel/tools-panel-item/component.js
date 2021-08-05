/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useToolsPanelContext } from '../context';
import { useToolsPanelItem } from './hook';
import { MENU_STATES } from '../utils';
import { View } from '../../view';
import { contextConnect } from '../../ui/context';

// This wraps controls to be conditionally displayed within a tools panel. It
// prevents props being applied to HTML elements that would make them invalid.
const ToolsPanelItem = ( props, forwardedRef ) => {
	const {
		children,
		hasValue,
		isShownByDefault,
		label,
		onDeselect = () => undefined,
		onSelect = () => undefined,
		...toolsPanelItemProps
	} = useToolsPanelItem( props );

	const {
		checkMenuItem,
		menuItems,
		registerPanelItem,
	} = useToolsPanelContext();

	const isValueSet = hasValue();

	useEffect( () => {
		registerPanelItem( {
			hasValue,
			isShownByDefault,
			label,
		} );
	}, [] );

	// When the user sets a value on the panel item's control, tell the panel
	// to check its corresponding menu item.
	useEffect( () => {
		if ( isValueSet ) {
			checkMenuItem( label );
		}
	}, [ isValueSet ] );

	// Note: `label` is used as a key when building menu item state in
	// `ToolsPanel`.
	const isMenuItemChecked = menuItems[ label ] === MENU_STATES.CHECKED;
	const wasMenuItemChecked = usePrevious( isMenuItemChecked );

	useEffect( () => {
		// If the panel's menu item is now checked but wasn't previously and
		// we don't have a current value, consider the menu item has just been
		// selected.
		if (
			isMenuItemChecked &&
			! isValueSet &&
			wasMenuItemChecked === false
		) {
			onSelect();
		}

		if ( ! isMenuItemChecked && wasMenuItemChecked ) {
			onDeselect();
		}
	}, [ isMenuItemChecked, wasMenuItemChecked, isValueSet ] );

	// Do not show if menu item not selected and not shown by default.
	if ( menuItems[ label ] === MENU_STATES.UNCHECKED ) {
		return null;
	}

	return (
		<View { ...toolsPanelItemProps } ref={ forwardedRef }>
			{ children }
		</View>
	);
};

const ConnectedToolsPanelItem = contextConnect(
	ToolsPanelItem,
	'ToolsPanelItem'
);

export default ConnectedToolsPanelItem;
