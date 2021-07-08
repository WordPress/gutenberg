/**
 * External dependencies
 */
import classnames from 'classnames';
import noop from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressiveDisclosurePanelTitle from './title';

const ProgressiveDisclosurePanel = ( props ) => {
	const { children, className, label: menuLabel, resetAll, title } = props;
	const [ menuItems, setMenuItems ] = useState( {} );

	// When conditionally including components e.g. { isShown && <Component /> }
	// a boolean `false` will be passed as a child if component is excluded.
	// This panel is only interested in the children to be displayed.
	const filteredChildren = useMemo( () => {
		return Array.isArray( children ) ? children.filter( Boolean ) : [];
	}, [ children ] );

	// Refresh which children should be reflected in the menu and what their
	// associated menu item's state is; checked or not.
	useEffect( () => {
		const items = {};

		filteredChildren.forEach( ( child ) => {
			// New item is checked if:
			// - it currently has a value
			// - or it was checked in previous menuItems state.
			items[ child.props.label ] =
				child.props.hasValue( child.props ) ||
				menuItems[ child.props.label ];
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
		const { onDeselect = noop, onSelect = noop } = child.props;

		if ( wasSelected ) {
			onDeselect( child.props );
		} else {
			onSelect( child.props );
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
			<ProgressiveDisclosurePanelTitle
				menuLabel={ menuLabel }
				title={ title }
				menuItems={ menuItems }
				toggleChild={ toggleChild }
				resetAll={ resetAllChildren }
			/>
			{ filteredChildren.map( ( child ) => {
				// Only display the child if it is toggled on in the menu or is
				// set to display by default.
				const isShown =
					menuItems[ child.props.label ] ||
					child.props.isShownByDefault;

				return isShown ? child : null;
			} ) }
		</div>
	);
};

export default ProgressiveDisclosurePanel;
