/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected } from '../block-edit/context';
import { BlockSettingsButton } from '../block-settings';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

const FillWithSettingsButton = ( { children, ...props } ) => {
	return (
		<>
			<Fill { ...props }>{ children }</Fill>
			{ React.Children.count( children ) > 0 && ( <BlockSettingsButton /> ) }
		</>
	);
};

const InspectorControls = ifBlockEditSelected( FillWithSettingsButton );

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;

