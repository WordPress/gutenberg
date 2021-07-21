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
	useMemo,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressiveDisclosurePanelItem from './item';
import ProgressiveDisclosurePanelTitle from './title';

const PanelContext = createContext( {} );

export const usePanelContext = () => useContext( PanelContext );

const isMenuItem = ( item ) => item.type === ProgressiveDisclosurePanelItem;

const ProgressiveDisclosurePanel = ( props ) => {
	const { children, className, label: menuLabel, resetAll, title } = props;
	const [ menuItems, setMenuItems ] = useState( {} );

	// This panel only needs to concern itself with the
	// ProgressiveDisclosurePanelItem components to be displayed in the menu.
	const filteredChildren = useMemo( () => {
		return Array.isArray( children ) ? children.filter( isMenuItem ) : [];
	}, [ children ] );

	// Refresh which children should be reflected in the menu and what their
	// associated menu item's state is; checked or not.
	useEffect( () => {
		const items = {};

		filteredChildren.forEach( ( { props: { hasValue, label } } ) => {
			// New item is checked if:
			// - it currently has a value
			// - or it was checked in previous menuItems state.
			items[ label ] = hasValue() || menuItems[ label ];
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
		const { onDeselect, onSelect } = child.props;

		if ( wasSelected && onDeselect ) {
			onDeselect();
		}

		if ( ! wasSelected && onSelect ) {
			onSelect();
		}

		setMenuItems( {
			...menuItems,
			[ label ]: ! wasSelected,
		} );
	};

	// Resets display of children and executes resetAll callback if available.
	const resetAllChildren = () => {
		if ( typeof resetAll === 'function' ) {
			resetAll();
		}

		// Turn off all menu items. Default controls will continue to display
		// by virtue of their `isShownByDefault` prop.
		const resetMenuItems = {};

		filteredChildren.forEach( ( child ) => {
			resetMenuItems[ child.props.label ] = false;
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
				<ProgressiveDisclosurePanelTitle
					menuLabel={ menuLabel }
					title={ title }
					toggleChild={ toggleChild }
					resetAll={ resetAllChildren }
				/>
				{ children }
			</PanelContext.Provider>
		</div>
	);
};

export default ProgressiveDisclosurePanel;
