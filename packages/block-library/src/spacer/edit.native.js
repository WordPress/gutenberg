
/**
 * External dependencies
 */
import React from 'react';
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	PanelBody,
	BottomSheet,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import {
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

const minSpacerHeight = 20;
const maxSpacerHeight = 500;

const SpacerEdit = ( { isSelected } ) => {
	const [ spacerHeight, setSpacerHeight ] = useState( 20 );

	const changeSpacerHeight = ( value ) => {
		if ( value < minSpacerHeight ) {
			return setSpacerHeight( minSpacerHeight );
		} else if ( value > maxSpacerHeight ) {
			return setSpacerHeight( maxSpacerHeight );
		} return setSpacerHeight( value );
	};

	const getInspectorControls = () => (
		<InspectorControls>
			<PanelBody title={ __( 'SpacerSettings' ) } >
				<BottomSheet.RangeCell
					icon={ 'admin-settings' }
					label={ __( 'Slider' ) }
					value={ spacerHeight }
					minimumValue={ minSpacerHeight }
					maximumValue={ maxSpacerHeight }
					separatorType={ 'fullWidth' }
					onChangeValue={ ( value ) => changeSpacerHeight( value ) }
				/>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<View style={ [ styles.staticSpacer, isSelected && styles.selectedSpacer, { height: spacerHeight } ] }>
			{ getInspectorControls() }
		</View>
	);
};

export default SpacerEdit;
