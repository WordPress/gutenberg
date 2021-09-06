/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

export function useToolsPanel( props ) {
	const { className, resetAll, ...otherProps } = useContextSystem(
		props,
		'ToolsPanel'
	);

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.ToolsPanel, className );
	}, [ className ] );

	// Allow panel items to register themselves.
	const [ panelItems, setPanelItems ] = useState( [] );

	const registerPanelItem = ( item ) => {
		setPanelItems( ( items ) => [ ...items, item ] );
	};

	// Panels need to deregister on unmount to avoid orphans in menu state.
	// This is an issue when panel items are being injected via SlotFills.
	const deregisterPanelItem = ( label ) => {
		setPanelItems( ( items ) =>
			items.filter( ( item ) => item.label !== label )
		);
	};

	// Manage and share display state of menu items representing child controls.
	const [ menuItems, setMenuItems ] = useState( {} );

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
			resetAll();
		}

		// Turn off display of all non-default items.
		const resetMenuItems = {};

		panelItems.forEach( ( { label, isShownByDefault } ) => {
			resetMenuItems[ label ] = !! isShownByDefault;
		} );

		setMenuItems( resetMenuItems );
	};

	const panelContext = { menuItems, registerPanelItem, deregisterPanelItem };

	return {
		...otherProps,
		panelContext,
		resetAllItems,
		toggleItem,
		className: classes,
	};
}
