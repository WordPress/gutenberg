import clsx from 'clsx';
import { usePrevious } from '@wordpress/compose';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import styles from '../style.module.scss';
import { useToolsPanelContext } from '../context';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { ToolsPanelItemProps } from '../types';

const noop = () => {};

export function useToolsPanelItem(
	props: WordPressComponentProps< ToolsPanelItemProps, 'div' >
) {
	const {
		className,
		defaultShown,
		hasValue,
		isShownByDefault = false,
		label,
		panelId,
		resetAllFilter = noop,
		onDeselect,
		onSelect,
		onShownChange,
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

	// `defaultShown` seeds an item's visibility when it registers, and is
	// deliberately not reactive. Holding it in a ref keeps it out of the
	// registration effect below, so a change on its own cannot deregister and
	// re-register the item, which would discard the visibility the user chose
	// from the menu.
	//
	// The ref still tracks the latest value, so that a re-registration caused
	// by something else, such as `panelId` changing, seeds from the current
	// preference rather than a stale one.
	const defaultShownRef = useRef( defaultShown );
	// Declared before the registration effect below so that it has already
	// run by the time that effect reads the ref in the same commit.
	useLayoutEffect( () => {
		defaultShownRef.current = defaultShown;
	} );

	// `onShownChange` is also a new function on every render. Holding it in a
	// ref lets the item register a stable callback, so it isn't re-registered
	// on each render, while the panel still invokes the latest one.
	const onShownChangeRef = useRef( onShownChange );
	useEffect( () => {
		onShownChangeRef.current = onShownChange;
	} );
	const onShownChangeCallback = useCallback(
		( isShown: boolean ) => onShownChangeRef.current?.( isShown ),
		[]
	);

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
				defaultShown: defaultShownRef.current,
				hasValue: hasValueCallback,
				isShownByDefault,
				label,
				onShownChange: onShownChangeCallback,
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
		onShownChangeCallback,
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
	// Items that don't belong to the panel on screen stay silent, otherwise
	// they would leave an orphaned entry in its menu.
	useEffect( () => {
		if ( ! hasMatchingPanel || ( ! isShownByDefault && ! isValueSet ) ) {
			return;
		}

		flagItemCustomization( isValueSet, label, menuGroup );
	}, [
		hasMatchingPanel,
		isValueSet,
		menuGroup,
		label,
		flagItemCustomization,
		isShownByDefault,
	] );

	// An item has no menu entry until it registers with the panel, so on that
	// first render its previous checked state is `undefined` rather than `false`.
	// Items that register already shown — because they have a value, or because
	// `defaultShown` was set — must not be treated as though the user had just
	// selected them from the menu.
	const wasRegistered = wasMenuItemChecked !== undefined;

	// Determine if the panel item's corresponding menu is being toggled and
	// trigger appropriate callback if it is.
	useEffect( () => {
		// We check whether this item is currently registered as items rendered
		// via fills can persist through the parent panel being remounted.
		// See: https://github.com/WordPress/gutenberg/pull/45673
		if (
			! isRegistered ||
			! wasRegistered ||
			isResetting ||
			! hasMatchingPanel
		) {
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
		wasRegistered,
		onSelect,
		onDeselect,
	] );

	// The item is shown if it is a default control regardless of whether it
	// has a value. Optional items are shown when they are checked or have
	// a value.
	const isShown = isShownByDefault
		? menuItems?.[ menuGroup ]?.[ label ] !== undefined
		: isMenuItemChecked;

	const shouldApplyPlaceholderStyles = shouldRenderPlaceholder && ! isShown;
	const classes = clsx(
		styles[ 'tools-panel-item' ],
		shouldApplyPlaceholderStyles &&
			styles[ 'tools-panel-item-placeholder' ],
		! shouldApplyPlaceholderStyles && className,
		firstDisplayedItem === label && __experimentalFirstVisibleItemClass,
		lastDisplayedItem === label && __experimentalLastVisibleItemClass
	);

	return {
		...otherProps,
		isShown,
		shouldRenderPlaceholder,
		className: classes,
	};
}
