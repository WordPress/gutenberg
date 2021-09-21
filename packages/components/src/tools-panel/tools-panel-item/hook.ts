/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import { useCallback, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ToolsPanelItemProps } from '../types';

const noop = () => undefined;

export function useToolsPanelItem(
	props: WordPressComponentProps< ToolsPanelItemProps, 'div' >
) {
	const {
		className,
		hasValue,
		isShownByDefault,
		label,
		panelId,
		resetAllFilter,
		onDeselect = noop,
		onSelect = noop,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanelItem, className );
	}, [ className ] );

	const {
		panelId: currentPanelId,
		menuItems,
		registerPanelItem,
		deregisterPanelItem,
		flagItemCustomization,
		isResetting,
	} = useToolsPanelContext();

	const hasValueCallback = useCallback( hasValue, [ panelId ] );
	const resetAllFilterCallback = useCallback( resetAllFilter, [ panelId ] );

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	useEffect( () => {
		if ( currentPanelId === panelId ) {
			registerPanelItem( {
				hasValue: hasValueCallback,
				isShownByDefault,
				label,
				resetAllFilter: resetAllFilterCallback,
				panelId,
			} );
		}

		return () => deregisterPanelItem( label );
	}, [
		currentPanelId,
		panelId,
		isShownByDefault,
		label,
		hasValueCallback,
		resetAllFilterCallback,
	] );

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
