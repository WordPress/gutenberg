/**
 * External dependencies
 */
import classnames from 'classnames';
import noop from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ProgressiveDisclosurePanelTitle from './title';

const ProgressiveDisclosurePanel = ( props ) => {
	const { children, className, label: menuLabel, resetAll, title } = props;
	const [ menuItems, setMenuItems ] = useState( {} );
	const [ defaultChildren, setDefaultChildren ] = useState( {} );

	// When conditionally including components e.g. { isShown && <Component /> }
	// a boolean `false` will be passed as a child if component is excluded.
	// This panel is only interested in the children to be displayed.
	const filteredChildren = Array.isArray( children )
		? children.filter( Boolean )
		: [];

	// Collect which children have custom values. Used to update menu state to
	// reflect customization for children that display by default / always show.
	const customizedChildren = filteredChildren.map( ( child ) =>
		child.props.hasValue( child.props ) ? child.props.label : undefined
	);

	// On first render determine initial menu state and which children should
	// always display by default.
	useEffect( () => {
		const items = {};
		const defaults = {};

		filteredChildren.forEach( ( child ) => {
			items[ child.props.label ] = child.props.hasValue( child.props );
			defaults[ child.props.label ] = child.props.isShownByDefault;
		} );

		setMenuItems( items );
		setDefaultChildren( defaults );
	}, [] );

	// As the default children are visible all the time. Reflect their
	// customizations in the menu items' selected state.
	useEffect( () => {
		const menuLabels = Object.keys( menuItems );

		// Skip if no children or menu state not initialized.
		if ( menuLabels.length === 0 ) {
			return;
		}

		const updatedItems = { ...menuItems };
		menuLabels.forEach( ( label ) => {
			if ( defaultChildren[ label ] ) {
				updatedItems[ label ] = customizedChildren.includes( label );
			}
		} );

		setMenuItems( updatedItems );
	}, customizedChildren );

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
		resetAll();

		// Turn off menu items unless they are to display by default.
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
					defaultChildren[ child.props.label ];

				return isShown ? child : null;
			} ) }
		</div>
	);
};

export default ProgressiveDisclosurePanel;
