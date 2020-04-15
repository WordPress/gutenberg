/**
 * External dependencies
 */
import React from 'react';
import { View, TouchableWithoutFeedback, I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { createSlotFill, ToolbarButton, Toolbar } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import Breadcrumbs from '../block-list/breadcrumb';
import NavigateUpSVG from './nav-up-icon';

const { Fill, Slot } = createSlotFill( 'FloatingToolbar' );

const FloatingToolbarContainer = ( { clientId, parentId, onNavigateUp } ) => {
	return (
		<TouchableWithoutFeedback accessible={ false }>
			<View style={ styles.floatingToolbar }>
				{ !! parentId && (
					<Toolbar passedStyle={ styles.toolbar }>
						<ToolbarButton
							title={ __( 'Navigate Up' ) }
							onClick={ () => onNavigateUp( parentId ) }
							icon={
								<NavigateUpSVG isRTL={ I18nManager.isRTL } />
							}
						/>
						<View style={ styles.pipe } />
					</Toolbar>
				) }
				<Breadcrumbs clientId={ clientId } />
			</View>
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
		getBlockRootClientId,
		getBlockCount,
	} = select( 'core/block-editor' );

	const isSelected = isBlockSelected( clientId );
	const rootBlockId = getBlockHierarchyRootClientId( clientId );
	const parentId = getBlockRootClientId( clientId );
	const hasRootInnerBlocks = getBlockCount( rootBlockId );

	const showFloatingToolbar = isSelected && hasRootInnerBlocks;

	return {
		showFloatingToolbar,
		parentId,
	};
} )( FloatingToolbarFill );

FloatingToolbar.Slot = Slot;

export default FloatingToolbar;
