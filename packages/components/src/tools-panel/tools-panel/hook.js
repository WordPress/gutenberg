/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanel( props ) {
	const { className, resetAll, panelId, ...otherProps } = useContextSystem(
		props,
		'ToolsPanel'
	);

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanel, className );
	}, [ className ] );

	const isResetting = useRef( false );
	const wasResetting = isResetting.current;

	// `isResetting` is cleared via this hook to effectively batch together
	// the resetAll task. Without this, the flag is cleared after the first
	// control updates and forces a rerender with subsequent controls then
	// believing they need to reset, unfortunately using stale data.
	useEffect( () => {
		if ( wasResetting ) {
			isResetting.current = false;
		}
	}, [ wasResetting ] );

	// Allow panel items to register themselves.
	const [ panelItems, setPanelItems ] = useState( [] );

	const registerPanelItem = ( item ) => {
		setPanelItems( ( items ) => [ ...items, item ] );
	};

	// Panels need to deregister on unmount to avoid orphans in menu state.
	// This is an issue when panel items are being injected via SlotFills.
	const deregisterPanelItem = ( label ) => {
		// When switching selections between components injecting matching
		// controls, e.g. both panels have a "padding" control, the
		// deregistration of the first panel doesn't occur until after the
		// registration of the next.
		const index = panelItems.findIndex( ( item ) => item.label === label );

		if ( index !== -1 ) {
			setPanelItems( ( items ) => items.splice( index, 1 ) );
		}
	};

	// Manage and share display state of menu items representing child controls.
	const [ menuItems, setMenuItems ] = useState( {} );

	const getResetAllFilters = () => {
		const filters = [];

		panelItems.forEach( ( item ) => {
			if ( item.resetAllFilter ) {
				filters.push( item.resetAllFilter );
			}
		} );

		return filters;
	};

	// Setup menuItems state as panel items register themselves.
	useEffect( () => {
		const items = {};

		panelItems.forEach( ( { hasValue, isShownByDefault, label } ) => {
			items[ label ] = isShownByDefault || hasValue();
		} );

		setMenuItems( items );
	}, [ panelItems ] );

	// Toggle the checked state of a menu item which is then used to determine
	// display of the item within the panel.
	const toggleItem = ( label ) => {
		setMenuItems( {
			...menuItems,
			[ label ]: ! menuItems[ label ],
		} );
	};

	// Resets display of children and executes resetAll callback if available.
	const resetAllItems = () => {
		if ( typeof resetAll === 'function' ) {
			isResetting.current = true;
			resetAll( getResetAllFilters() );
		}

		// Turn off display of all non-default items.
		const resetMenuItems = {};

		panelItems.forEach( ( { label, isShownByDefault } ) => {
			resetMenuItems[ label ] = !! isShownByDefault;
		} );

		setMenuItems( resetMenuItems );
	};

	const panelContext = {
		panelId,
		menuItems,
		registerPanelItem,
		deregisterPanelItem,
		isResetting: isResetting.current,
	};

	return {
		...otherProps,
		panelContext,
		resetAllItems,
		toggleItem,
		className: classes,
	};
}
