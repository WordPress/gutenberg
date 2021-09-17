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
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanelItem( props ) {
	const {
		className,
		hasValue,
		isShownByDefault,
		label,
		panelId,
		resetAllFilter,
		onDeselect = () => undefined,
		onSelect = () => undefined,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelItem, className );
	} );

	const {
		panelId: currentPanelId,
		menuItems,
		registerPanelItem,
		deregisterPanelItem,
		flagItemCustomization,
		isResetting,
	} = useToolsPanelContext();

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	useEffect( () => {
		if ( currentPanelId === panelId ) {
			registerPanelItem( {
				hasValue,
				isShownByDefault,
				label,
				resetAllFilter,
				panelId,
			} );
		}

		return () => deregisterPanelItem( label );
	}, [ panelId ] );

	const isValueSet = hasValue();
	const wasValueSet = usePrevious( isValueSet );

	// If this item represents a default control it will need to notify the
	// panel when a custom value has been set.
	useEffect( () => {
		if ( isShownByDefault && isValueSet && ! wasValueSet ) {
			flagItemCustomization( label );
		}
	}, [ isValueSet, wasValueSet, isShownByDefault, label ] );

	// Note: `label` is used as a key when building menu item state in
	// `ToolsPanel`.
	const menuGroup = isShownByDefault ? 'default' : 'optional';
	const isMenuItemChecked = menuItems?.[ menuGroup ]?.[ label ];
	const wasMenuItemChecked = usePrevious( isMenuItemChecked );

	// Determine if the panel item's corresponding menu is being toggled and
	// trigger appropriate callback if it is.
	useEffect( () => {
		if ( isResetting ) {
			return;
		}

		if ( isMenuItemChecked && ! isValueSet && ! wasMenuItemChecked ) {
			onSelect();
		}

		if ( ! isMenuItemChecked && wasMenuItemChecked ) {
			onDeselect();
		}
	}, [ isMenuItemChecked, wasMenuItemChecked, isValueSet, isResetting ] );

	// The item is shown if it is a default control regardless of whether it
	// has a value. Optional items are shown when they are checked or have
	// a value.
	const isShown = isShownByDefault
		? menuItems?.[ menuGroup ]?.[ label ] !== undefined
		: isMenuItemChecked;

	return {
		...otherProps,
		isShown,
		className: classes,
	};
}
