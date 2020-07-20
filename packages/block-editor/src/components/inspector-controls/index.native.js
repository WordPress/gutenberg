/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { createSlotFill, BottomSheetConsumer } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../block-edit/context';
import { BlockSettingsButton } from '../block-settings';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

/**
 * Adds the block settings button when the inspector control has children
 *
 * In some cases we don't want to show the block settings button
 * even if the the inspector controls have children. We can exclude
 * those childen by passing the 'dontCount' prop
 * (e.g. The color picker control of the Cover block is triggered
 * by a separate swatch button)
 * */
const FillWithSettingsButton = ( { children, ...props } ) => {
	const { isSelected } = useBlockEditContext();
	if ( ! isSelected ) {
		return null;
	}

	return (
		<>
			<Fill { ...props }>
				{
					<BottomSheetConsumer>
						{ () => <View>{ children }</View> }
					</BottomSheetConsumer>
				}
			</Fill>
			{ React.Children.toArray( children ).filter(
				( child ) => child.props.dontCount !== true
			).length > 0 && <BlockSettingsButton /> }
		</>
	);
};

const InspectorControls = FillWithSettingsButton;

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
