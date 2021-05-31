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
	const classes = classnames( 'components-block-support-panel', className );

	// Collect data to manage control visibility via the panel's dropdown menu.
	useEffect( () => {
		const items = {};

		children.forEach( ( child ) => {
			items[ child.props.label ] = child.props.hasValue( child.props );
		} );

		setMenuItems( items );
	}, [] );

	const getControlByMenuLabel = ( label ) => {
		return children.find( ( child ) => child.props.label === label );
	};

	// Toggles display of a block support control resetting the attributes if
	// being turned off.
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

		// Turn off all the controls in menu.
		const resetMenuItems = {};

		children.forEach( ( child ) => {
			resetMenuItems[ child.props.label ] = false;
		} );

		setMenuItems( resetMenuItems );
	};

	return (
		<div className={ classes }>
			<BlockSupportPanelTitle
				menuLabel={ menuLabel }
				title={ title }
				menuItems={ menuItems }
				toggleControl={ toggleControl }
				resetAll={ resetAllControls }
			/>
			{ children.map( ( child ) => {
				const { label, hasValue } = child.props;

				// Only display the block support controls if the support
				// attributes have a value or the controls have be chosen for
				// display by the user.
				if ( menuItems[ label ] || hasValue( child.props ) ) {
					return child;
				}

				return null;
			} ) }
		</div>
	);
};

export default BlockSupportPanel;
