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
import ProgressiveDisclosurePanelHeader from '../progressive-disclosure-panel-header';

const PanelContext = createContext( {} );

export const usePanelContext = () => useContext( PanelContext );

const ProgressiveDisclosurePanel = ( props ) => {
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
			// Menu item is checked if:
			// - it currently has a value
			// - or it was checked in previous menuItems state.
			const isChecked = hasValue() || menuItems[ label ] === true;

			// Menu item will be `disabled` if:
			// - it is not checked
			// - and is shown by default.
			const isDisabled = ! isChecked && isShownByDefault;

			items[ label ] = isDisabled ? 'disabled' : isChecked;
		} );

		setMenuItems( items );
	}, [ panelItems ] );

	// When a panel item gets a value set, update its menu item.
	const checkMenuItem = ( label ) => {
		setMenuItems( ( items ) => ( {
			...items,
			[ label ]: true,
		} ) );
	};

	// Toggles the customized state of the panel item and its display if it
	// isn't to be displayed by default. When toggling a panel item its
	// onSelect or onDeselect callbacks are called as appropriate.
	const toggleItem = ( label ) => {
		const wasSelected = menuItems[ label ];
		const panelItem = panelItems.find( ( item ) => item.label === label );

		if ( wasSelected && panelItem?.onDeselect ) {
			panelItem.onDeselect();
		}

		if ( ! wasSelected && panelItem?.onSelect ) {
			panelItem.onSelect();
		}

		// If item was checked but is no longer and also shown by default
		// disable the item's menu item.
		const isDisabled = wasSelected && panelItem.isShownByDefault;

		setMenuItems( {
			...menuItems,
			[ label ]: isDisabled ? 'disabled' : ! wasSelected,
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
			resetMenuItems[ label ] = isShownByDefault ? 'disabled' : false;
		} );

		setMenuItems( resetMenuItems );
	};

	const classes = classnames(
		'components-progressive-disclosure-panel',
		className
	);

	const panelContext = { checkMenuItem, menuItems, registerPanelItem };

	return (
		<div className={ classes }>
			<PanelContext.Provider value={ panelContext }>
				<ProgressiveDisclosurePanelHeader
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

export default ProgressiveDisclosurePanel;
