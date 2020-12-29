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
			{ React.Children.count( children ) > 0 && <BlockSettingsButton /> }
		</>
	);
};

const InspectorControls = FillWithSettingsButton;

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
