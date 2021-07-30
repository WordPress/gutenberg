/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	Children,
	createContext,
	useContext,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressiveDisclosurePanelItem from '../progressive-disclosure-panel-item';
import ProgressiveDisclosurePanelHeader from '../progressive-disclosure-panel-header';

const PanelContext = createContext( {} );

export const usePanelContext = () => useContext( PanelContext );

const isMenuItem = ( item ) => item?.type === ProgressiveDisclosurePanelItem;

const ProgressiveDisclosurePanel = ( props ) => {
	const { children, className, header, label: menuLabel, resetAll } = props;
	const [ menuItems, setMenuItems ] = useState( {} );

	// This panel only needs to concern itself with the
	// ProgressiveDisclosurePanelItem components to be displayed in the menu.
	const filteredChildren = useMemo( () => {
		return Children.toArray( children ).filter( isMenuItem );
	}, [ children ] );

	// Refresh which children should be reflected in the menu and what their
	// associated menu item's state is; checked or not.
	useEffect( () => {
		const items = {};

		filteredChildren.forEach( ( { props: childProps } ) => {
			const { hasValue, isShownByDefault, label } = childProps;

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
	}, [ filteredChildren ] );

	if ( filteredChildren.length === 0 ) {
		return null;
	}

	const getChildByMenuLabel = ( label ) => {
		return filteredChildren.find(
			( child ) => child.props.label === label
		);
	};

	// Toggles the customized state of the child and its display if it isn't to
	// be displayed by default. When toggling a child it's callback is executed.
	const toggleChild = ( label ) => {
		const wasSelected = menuItems[ label ];
		const child = getChildByMenuLabel( label );
		const { onDeselect, onSelect, isShownByDefault } = child.props;

		if ( wasSelected && onDeselect ) {
			onDeselect();
		}

		if ( ! wasSelected && onSelect ) {
			onSelect();
		}

		// If child is was checked but is no longer and also shown by default
		// disable the child's menu item.
		const isDisabled = wasSelected && isShownByDefault;

		setMenuItems( {
			...menuItems,
			[ label ]: isDisabled ? 'disabled' : ! wasSelected,
		} );
	};

	// Resets display of children and executes resetAll callback if available.
	const resetAllChildren = () => {
		if ( typeof resetAll === 'function' ) {
			resetAll();
		}

		// Turn off all menu items. Default controls will continue to display
		// by virtue of their `isShownByDefault` prop however their menu item
		// will be disabled to prevent behaviour where toggling has no effect.
		const resetMenuItems = {};

		filteredChildren.forEach( ( { props: childProps } ) => {
			const { label, isShownByDefault } = childProps;
			resetMenuItems[ label ] = isShownByDefault ? 'disabled' : false;
		} );

		setMenuItems( resetMenuItems );
	};

	const classes = classnames(
		'components-progressive-disclosure-panel',
		className
	);

	return (
		<div className={ classes }>
			<PanelContext.Provider value={ menuItems }>
				<ProgressiveDisclosurePanelHeader
					header={ header }
					menuLabel={ menuLabel }
					resetAll={ resetAllChildren }
					toggleChild={ toggleChild }
				/>
				{ children }
			</PanelContext.Provider>
		</div>
	);
};

export default ProgressiveDisclosurePanel;
