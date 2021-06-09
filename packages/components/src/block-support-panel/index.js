/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockSupportPanelTitle from './title';

const BlockSupportPanel = ( props ) => {
	const { children, className, label: menuLabel, resetAll, title } = props;
	const [ menuItems, setMenuItems ] = useState( {} );
	const [ defaultControls, setDefaultControls ] = useState( {} );

	// If a block support UI has been disabled via theme.json a boolean `false`
	// will be passed as a child. This panel is only interested in the children
	// to be displayed.
	const filteredChildren = Array.isArray( children )
		? children.filter( Boolean )
		: [];

	// Collect which controls have custom values. Used to update menu state to
	// reflect customization for controls that display by default / always show.
	const customizedChildren = filteredChildren.map( ( child ) =>
		child.props.hasValue( child.props ) ? child.props.label : undefined
	);

	// On first render determine initial menu state and which controls should
	// always display by default.
	useEffect( () => {
		const items = {};
		const defaults = {};

		filteredChildren.forEach( ( child ) => {
			items[ child.props.label ] = child.props.hasValue( child.props );
			defaults[ child.props.label ] = child.props.isShownByDefault;
		} );

		setMenuItems( items );
		setDefaultControls( defaults );
	}, [] );

	// As the default controls are visible all the time. Reflect their
	// customizations in the menu items' selected state.
	useEffect( () => {
		const menuLabels = Object.keys( menuItems );

		// Skip if no children or menu state not initialized.
		if ( menuLabels.length === 0 ) {
			return;
		}

		const updatedItems = { ...menuItems };
		menuLabels.forEach( ( label ) => {
			if ( defaultControls[ label ] ) {
				updatedItems[ label ] = customizedChildren.includes( label );
			}
		} );

		setMenuItems( updatedItems );
	}, customizedChildren );

	if ( filteredChildren.length === 0 ) {
		return null;
	}

	const getControlByMenuLabel = ( label ) => {
		return filteredChildren.find(
			( child ) => child.props.label === label
		);
	};

	// Toggles the customized state of the block support control and its display
	// if it isn't to be displayed by default. When toggling off a control its
	// associated block attribute is reset via the control's reset callback.
	const toggleControl = ( label ) => {
		const isSelected = menuItems[ label ];

		if ( isSelected ) {
			const control = getControlByMenuLabel( label );
			control.props.reset( control.props );
		}

		setMenuItems( {
			...menuItems,
			[ label ]: ! isSelected,
		} );
	};

	// Resets all block support attributes for controls represented by the
	// menu items. Then turns off their display.
	const resetAllControls = () => {
		// Reset the block support attributes.
		resetAll();

		// Turn off menu items unless they are to display by default.
		const resetMenuItems = {};

		filteredChildren.forEach( ( child ) => {
			resetMenuItems[ child.props.label ] = false;
		} );

		setMenuItems( resetMenuItems );
	};

	const classes = classnames( 'components-block-support-panel', className );

	return (
		<div className={ classes }>
			<BlockSupportPanelTitle
				menuLabel={ menuLabel }
				title={ title }
				menuItems={ menuItems }
				toggleControl={ toggleControl }
				resetAll={ resetAllControls }
			/>
			{ filteredChildren.map( ( child ) => {
				// Only display the block support control if it is toggled on
				// in the menu or is set to display by default.
				const isShown =
					menuItems[ child.props.label ] ||
					defaultControls[ child.props.label ];

				return isShown ? child : null;
			} ) }
		</div>
	);
};

export default BlockSupportPanel;
