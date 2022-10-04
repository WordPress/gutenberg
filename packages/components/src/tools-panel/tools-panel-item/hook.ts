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
		onDeselect,
		onSelect,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const {
		panelId: currentPanelId,
		menuItems,
		registerPanelItem,
		deregisterPanelItem,
		flagItemCustomization,
		isResetting,
		shouldRenderPlaceholderItems: shouldRenderPlaceholder,
		firstDisplayedItem,
		lastDisplayedItem,
		__experimentalFirstVisibleItemClass,
		__experimentalLastVisibleItemClass,
	} = useToolsPanelContext();

	const hasValueCallback = useCallback( hasValue, [ panelId ] );
	const resetAllFilterCallback = useCallback( resetAllFilter, [ panelId ] );
	const previousPanelId = usePrevious( currentPanelId );

	const hasMatchingPanel =
		currentPanelId === panelId || currentPanelId === null;

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	useEffect( () => {
		if ( hasMatchingPanel && previousPanelId !== null ) {
			registerPanelItem( {
				hasValue: hasValueCallback,
				isShownByDefault,
				label,
				resetAllFilter: resetAllFilterCallback,
				panelId,
			} );
		}

		return () => {
			if (
				( previousPanelId === null && !! currentPanelId ) ||
				currentPanelId === panelId
			) {
				deregisterPanelItem( label );
			}
		};
	}, [
		currentPanelId,
		hasMatchingPanel,
		isShownByDefault,
		label,
		hasValueCallback,
		panelId,
		previousPanelId,
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
		if ( isResetting || ! hasMatchingPanel ) {
			return;
		}

		if ( isMenuItemChecked && ! isValueSet && ! wasMenuItemChecked ) {
			onSelect?.();
		}

		if ( ! isMenuItemChecked && wasMenuItemChecked ) {
			onDeselect?.();
		}
	}, [
		hasMatchingPanel,
		isMenuItemChecked,
		isResetting,
		isValueSet,
		wasMenuItemChecked,
	] );

	// The item is shown if it is a default control regardless of whether it
	// has a value. Optional items are shown when they are checked or have
	// a value.
	const isShown = isShownByDefault
		? menuItems?.[ menuGroup ]?.[ label ] !== undefined
		: isMenuItemChecked;

	const cx = useCx();
	const classes = useMemo( () => {
		const placeholderStyle =
			shouldRenderPlaceholder &&
			! isShown &&
			styles.ToolsPanelItemPlaceholder;
		const firstItemStyle =
			firstDisplayedItem === label && __experimentalFirstVisibleItemClass;
		const lastItemStyle =
			lastDisplayedItem === label && __experimentalLastVisibleItemClass;
		return cx(
			styles.ToolsPanelItem,
			placeholderStyle,
			className,
			firstItemStyle,
			lastItemStyle
		);
	}, [
		isShown,
		shouldRenderPlaceholder,
		className,
		cx,
		firstDisplayedItem,
		lastDisplayedItem,
		__experimentalFirstVisibleItemClass,
		__experimentalLastVisibleItemClass,
	] );

	return {
		...otherProps,
		isShown,
		shouldRenderPlaceholder,
		className: classes,
	};
}
