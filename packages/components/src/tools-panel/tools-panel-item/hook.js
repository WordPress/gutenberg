/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { MENU_STATES } from '../utils';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanelItem( props ) {
	const {
		className,
		hasValue,
		isShownByDefault,
		label,
		onDeselect = () => undefined,
		onSelect = () => undefined,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelItem, className );
	} );

	const {
		checkMenuItem,
		menuItems,
		registerPanelItem,
	} = useToolsPanelContext();

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	useEffect( () => {
		registerPanelItem( {
			hasValue,
			isShownByDefault,
			label,
		} );
	}, [] );

	const isValueSet = hasValue();

	// When the user sets a value on the panel item's control, tell the panel
	// to check its corresponding menu item.
	useEffect( () => {
		if ( isValueSet ) {
			checkMenuItem( label );
		}
	}, [ isValueSet ] );

	// Note: `label` is used as a key when building menu item state in
	// `ToolsPanel`.
	const isShown = menuItems[ label ] !== MENU_STATES.UNCHECKED;
	const isMenuItemChecked = menuItems[ label ] === MENU_STATES.CHECKED;
	const wasMenuItemChecked = usePrevious( isMenuItemChecked );

	// Determine if the panel item's corresponding menu it is being toggled and
	// trigger appropriate callback if it is.
	useEffect( () => {
		// If the panel's menu item is now checked but wasn't previously and
		// we don't have a current value, consider the menu item as having just
		// been selected.
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

	return {
		...otherProps,
		isShown,
		className: classes,
	};
}
