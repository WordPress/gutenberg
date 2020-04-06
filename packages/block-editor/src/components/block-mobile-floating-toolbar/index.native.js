/**
 * External dependencies
 */
import React from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const { Fill, Slot } = createSlotFill( 'FloatingToolbar' );

const FloatingToolbarContainer = ( { children } ) => {
	return (
		<TouchableWithoutFeedback accessible={ false }>
			<View style={ styles.floatingToolbar }>{ children }</View>
		</TouchableWithoutFeedback>
	);
};

const FloatingToolbarFill = ( { showFloatingToolbar, ...props } ) => {
	if ( showFloatingToolbar ) {
		return (
			<Fill>
				<FloatingToolbarContainer { ...props } />
			</Fill>
		);
	}
	return null;
};

const FloatingToolbar = withSelect( ( select, { clientId } ) => {
	const {
		isBlockSelected,
		getBlockHierarchyRootClientId,
		getBlockCount,
	} = select( 'core/block-editor' );

	const isSelected = isBlockSelected( clientId );
	const rootBlockId = getBlockHierarchyRootClientId( clientId );
	const hasRootInnerBlocks = getBlockCount( rootBlockId );

	const showFloatingToolbar = isSelected && hasRootInnerBlocks;

	return {
		showFloatingToolbar,
	};
} )( FloatingToolbarFill );

FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
