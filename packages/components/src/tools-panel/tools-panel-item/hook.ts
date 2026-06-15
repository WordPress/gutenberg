/**
 * WordPress dependencies
 */
import { usePrevious } from '@wordpress/compose';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useToolsPanelContext } from '../context';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ToolsPanelItemProps } from '../types';

const noop = () => {};

export function useToolsPanelItem(
	props: WordPressComponentProps< ToolsPanelItemProps, 'div' >
) {
	const {
		className,
		hasValue,
		isShownByDefault = false,
		label,
		panelId,
		resetAllFilter = noop,
		onDeselect,
		onSelect,
		...otherProps
	} = useContextSystem( props, 'ToolsPanelItem' );

	const {
		panelId: currentPanelId,
		menuItems,
		registerResetAllFilter,
		deregisterResetAllFilter,
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

	// hasValue is a new function on every render, so do not add it as a
	// dependency to the useCallback hook! If needed, we should use a ref.
	const hasValueCallback = useCallback( hasValue, [ panelId ] );
	// resetAllFilter is a new function on every render, so do not add it as a
	// dependency to the useCallback hook! If needed, we should use a ref.
	const resetAllFilterCallback = useCallback( resetAllFilter, [ panelId ] );
	const previousPanelId = usePrevious( currentPanelId );

	const hasMatchingPanel =
		currentPanelId === panelId || currentPanelId === null;

	// Registering the panel item allows the panel to include it in its
	// automatically generated menu and determine its initial checked status.
	//
	// This is performed in a layout effect to ensure that the panel item
	// is registered before it is rendered preventing a rendering glitch.
	// See: https://github.com/WordPress/gutenberg/issues/56470
	useLayoutEffect( () => {
		if ( hasMatchingPanel && previousPanelId !== null ) {
			registerPanelItem( {
				hasValue: hasValueCallback,
				isShownByDefault,
				label,
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
		registerPanelItem,
		deregisterPanelItem,
	] );

	useEffect( () => {
		if ( hasMatchingPanel ) {
			registerResetAllFilter( resetAllFilterCallback );
		}
		return () => {
			if ( hasMatchingPanel ) {
				deregisterResetAllFilter( resetAllFilterCallback );
			}
		};
	}, [
		registerResetAllFilter,
		deregisterResetAllFilter,
		resetAllFilterCallback,
		hasMatchingPanel,
	] );

	// Note: `label` is used as a key when building menu item state in
	// `ToolsPanel`.
	const menuGroup = isShownByDefault ? 'default' : 'optional';
	const isMenuItemChecked = menuItems?.[ menuGroup ]?.[ label ];
	const wasMenuItemChecked = usePrevious( isMenuItemChecked );
	const isRegistered = menuItems?.[ menuGroup ]?.[ label ] !== undefined;

	const isValueSet = hasValue();
	// Notify the panel when an item's value has changed except for optional
	// items without value because the item should not cause itself to hide.
	useEffect( () => {
		if ( ! isShownByDefault && ! isValueSet ) {
			return;
		}

		flagItemCustomization( isValueSet, label, menuGroup );
	}, [
		isValueSet,
		menuGroup,
		label,
		flagItemCustomization,
		isShownByDefault,
	] );

	// Determine if the panel item's corresponding menu is being toggled and
	// trigger appropriate callback if it is.
	useEffect( () => {
		// We check whether this item is currently registered as items rendered
		// via fills can persist through the parent panel being remounted.
		// See: https://github.com/WordPress/gutenberg/pull/45673
		if ( ! isRegistered || isResetting || ! hasMatchingPanel ) {
			return;
		}

		if ( isMenuItemChecked && ! isValueSet && ! wasMenuItemChecked ) {
			onSelect?.();
		}

		if ( ! isMenuItemChecked && isValueSet && wasMenuItemChecked ) {
			onDeselect?.();
		}
	}, [
		hasMatchingPanel,
		isMenuItemChecked,
		isRegistered,
		isResetting,
		isValueSet,
		wasMenuItemChecked,
		onSelect,
		onDeselect,
	] );

	// The item is shown if it is a default control regardless of whether it
	// has a value. Optional items are shown when they are checked or have
	// a value.
	const isShown = isShownByDefault
		? menuItems?.[ menuGroup ]?.[ label ] !== undefined
		: isMenuItemChecked;

	const cx = useCx();
	const classes = useMemo( () => {
		const shouldApplyPlaceholderStyles =
			shouldRenderPlaceholder && ! isShown;
		const firstItemStyle =
			firstDisplayedItem === label && __experimentalFirstVisibleItemClass;
		const lastItemStyle =
			lastDisplayedItem === label && __experimentalLastVisibleItemClass;
		return cx(
			styles.ToolsPanelItem,
			shouldApplyPlaceholderStyles && styles.ToolsPanelItemPlaceholder,
			! shouldApplyPlaceholderStyles && className,
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
		label,
	] );

	return {
		...otherProps,
		isShown,
		shouldRenderPlaceholder,
		className: classes,
	};
}
