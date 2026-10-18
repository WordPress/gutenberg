import clsx from 'clsx';
import { useEvent } from '@wordpress/compose';
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

	// `hasValue` is a new function every render. It can't use `useEvent`
	// because the panel calls it while deriving the menu during render, which
	// `useEvent` forbids, so it stays keyed on the panel it was captured for.
	const hasValueCallback = useCallback( hasValue, [ panelId ] );
	// `resetAllFilter` only runs from the reset handler, so a stable identity
	// that always sees the latest props is both safe and more correct than
	// freezing it per panel.
	const resetAllFilterCallback = useEvent( resetAllFilter );

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

	// `onShownChange` is a new function every render. `useEvent` gives the item
	// a stable callback to register, while the panel still invokes the latest.
	const onShownChangeCallback = useEvent( onShownChange );

	// A panel spanning a multi-selection has no id of its own, so every item
	// belongs to it.
	const hasMatchingPanel =
		currentPanelId === panelId || currentPanelId === null;

	// A layout effect so the item is registered before it renders, avoiding a
	// glitch, and so a whole panel's worth of registrations land in one commit
	// for React to batch.
	// See: https://github.com/WordPress/gutenberg/issues/56470
	useLayoutEffect( () => {
		if ( ! hasMatchingPanel ) {
			return;
		}

		const item = {
			defaultShown: defaultShownRef.current,
			hasValue: hasValueCallback,
			isShownByDefault,
			label,
			onShownChange: onShownChangeCallback,
			panelId,
			resetAllFilter: resetAllFilterCallback,
		};
		registerPanelItem( item );

		// Passing the registration back lets the panel ignore this cleanup if
		// a replacement has already claimed the label, which happens when a
		// panel switches while its items arrive through a Slot.
		return () => {
			deregisterPanelItem( label, item );
		};
	}, [
		deregisterPanelItem,
		hasMatchingPanel,
		hasValueCallback,
		isShownByDefault,
		label,
		onShownChangeCallback,
		panelId,
		registerPanelItem,
		resetAllFilterCallback,
	] );

	const menuGroup = isShownByDefault ? 'default' : 'optional';
	const isMenuItemChecked = menuItems?.[ menuGroup ]?.[ label ];
	const isRegistered = isMenuItemChecked !== undefined;
	// Tracks the effect below rather than the render, so renders that leave
	// the checked state alone can't desync it.
	const wasMenuItemCheckedRef = useRef< boolean | undefined >( undefined );

	const isValueSet = hasValue();

	// An optional item losing its value must not hide itself, so only default
	// items report a value going away. Items belonging to another panel stay
	// silent or they would leave an orphaned entry in this panel's menu.
	//
	// Shares the layout phase with registration above so it runs against an
	// already registered item and batches with it.
	useLayoutEffect( () => {
		if ( ! hasMatchingPanel || ( ! isShownByDefault && ! isValueSet ) ) {
			return;
		}

		flagItemCustomization( isValueSet, label );
	}, [
		hasMatchingPanel,
		isValueSet,
		label,
		flagItemCustomization,
		isShownByDefault,
	] );

	// Passive so consumer callbacks don't run before the browser has painted.
	useEffect( () => {
		const wasMenuItemChecked = wasMenuItemCheckedRef.current;
		wasMenuItemCheckedRef.current = isMenuItemChecked;

		// An item has no menu entry until it registers, so the first time
		// through there is no previous checked state. Items that register
		// already shown, because they have a value or `defaultShown` was set,
		// must not look as though the user just selected them.
		const wasRegistered = wasMenuItemChecked !== undefined;

		// Items rendered via fills can outlive a remount of the panel they
		// belong to, leaving them unregistered.
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
		onSelect,
		onDeselect,
	] );

	// A default control shows whether or not it has a value; an optional one
	// shows once checked.
	const isShown = isShownByDefault ? isRegistered : isMenuItemChecked;

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
