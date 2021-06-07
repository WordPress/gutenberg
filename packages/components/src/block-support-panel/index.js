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

	// On first render determine initial menu state. Default controls will
	// initially display and have a check mark beside their menu item regardless
	// of whether they have a value.
	useEffect( () => {
		const items = {};
		const defaults = {};

		filteredChildren.forEach( ( child ) => {
			const { hasValue, isShownByDefault, label } = child.props;
			items[ label ] = isShownByDefault || hasValue( child.props );
			defaults[ label ] = isShownByDefault;
		} );

		setMenuItems( items );
		setDefaultControls( defaults );
	}, [] );

	if ( filteredChildren.length === 0 ) {
		return null;
	}

	const getControlByMenuLabel = ( label ) => {
		return filteredChildren.find(
			( child ) => child.props.label === label
		);
	};

	// Toggles the display of the block support control and resets its
	// associated block attribute via the control's reset callback prop.
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

		filteredChildren.forEach( ( { props: { label } } ) => {
			resetMenuItems[ label ] = defaultControls[ label ];
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
				return menuItems[ child.props.label ] ? child : null;
			} ) }
		</div>
	);
};

export default BlockSupportPanel;
