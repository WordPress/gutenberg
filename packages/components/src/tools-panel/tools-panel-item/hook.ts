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
		shouldRenderPlaceholderItems: shouldRenderPlaceholder,
		firstDisplayedItem,
		lastDisplayedItem,
		__experimentalFirstVisibleItemClass,
		__experimentalLastVisibleItemClass,
	} = useToolsPanelContext();

	// hasValue is a new function on every render, so do not add it as a
	// dependency to the useCallback hook! If needed, we should use a ref.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const hasValueCallback = useCallback( hasValue, [ panelId ] );
	// resetAllFilter is a new function on every render, so do not add it as a
	// dependency to the useCallback hook! If needed, we should use a ref.
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
				onDeselect,
				onSelect,
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
		onDeselect,
		onSelect,
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

	// The item is shown if it is a default control regardless of whether it
	// has a value. Optional items are shown when they are checked or have
	// a value.
	const isShown = isShownByDefault ? isRegistered : isMenuItemChecked;

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
