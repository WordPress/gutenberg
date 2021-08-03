/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolsPanelHeader from '../tools-panel-header';

const PanelContext = createContext( {} );
export const usePanelContext = () => useContext( PanelContext );

export const MENU_STATES = {
	CHECKED: 'checked',
	UNCHECKED: 'unchecked',
	DISABLED: 'disabled',
};

const ToolsPanel = ( props ) => {
	const { children, className, header, label: menuLabel, resetAll } = props;

	// Allow panel items to register themselves.
	const [ panelItems, setPanelItems ] = useState( [] );

	const registerPanelItem = ( item ) => {
		setPanelItems( ( items ) => [ ...items, item ] );
	};

	// Manage and share display state of menu items representing child controls.
	const [ menuItems, setMenuItems ] = useState( {} );

	// Setup menuItems state as panel items register themselves.
	useEffect( () => {
		const items = {};

		panelItems.forEach( ( { hasValue, isShownByDefault, label } ) => {
			let menuItemState = hasValue()
				? MENU_STATES.CHECKED
				: MENU_STATES.UNCHECKED;

			// Disable the menu item if its unchecked and a default control.
			if ( menuItemState === MENU_STATES.UNCHECKED && isShownByDefault ) {
				menuItemState = MENU_STATES.DISABLED;
			}

			items[ label ] = menuItemState;
		} );

		setMenuItems( items );
	}, [ panelItems ] );

	// When a panel item gets a value set, update its menu item.
	const checkMenuItem = ( label ) => {
		setMenuItems( ( items ) => ( {
			...items,
			[ label ]: MENU_STATES.CHECKED,
		} ) );
	};

	// Toggles the customized state of the panel item and its display if it
	// isn't to be displayed by default. When toggling a panel item its
	// onSelect or onDeselect callbacks are called as appropriate.
	const toggleItem = ( label ) => {
		const wasChecked = menuItems[ label ] === MENU_STATES.CHECKED;
		const panelItem = panelItems.find( ( item ) => item.label === label );

		if ( wasChecked && panelItem?.onDeselect ) {
			panelItem.onDeselect();
		}

		if ( ! wasChecked && panelItem?.onSelect ) {
			panelItem.onSelect();
		}

		let menuItemState = wasChecked
			? MENU_STATES.UNCHECKED
			: MENU_STATES.CHECKED;

		if (
			menuItemState === MENU_STATES.UNCHECKED &&
			panelItem.isShownByDefault
		) {
			menuItemState = MENU_STATES.DISABLED;
		}

		setMenuItems( {
			...menuItems,
			[ label ]: menuItemState,
		} );
	};

	// Resets display of children and executes resetAll callback if available.
	const resetAllItems = () => {
		if ( typeof resetAll === 'function' ) {
			resetAll();
		}

		// Turn off all menu items. Default controls will continue to display
		// by virtue of their `isShownByDefault` prop however their menu item
		// will be disabled to prevent behaviour where toggling has no effect.
		const resetMenuItems = {};

		panelItems.forEach( ( { label, isShownByDefault } ) => {
			resetMenuItems[ label ] = isShownByDefault
				? MENU_STATES.DISABLED
				: MENU_STATES.UNCHECKED;
		} );

		setMenuItems( resetMenuItems );
	};

	const classes = classnames( 'components-tools-panel', className );
	const panelContext = { checkMenuItem, menuItems, registerPanelItem };

	return (
		<div className={ classes }>
			<PanelContext.Provider value={ panelContext }>
				<ToolsPanelHeader
					header={ header }
					menuLabel={ menuLabel }
					resetAll={ resetAllItems }
					toggleItem={ toggleItem }
				/>
				{ children }
			</PanelContext.Provider>
		</div>
	);
};

export default ToolsPanel;
