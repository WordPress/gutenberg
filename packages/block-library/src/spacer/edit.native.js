
/**
 * External dependencies
 */
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

const SpacerEdit = ( { isSelected, attributes, setAttributes } ) => {
	const { height } = attributes;
	const [ sliderSpacerHeight, setSpacerHeight ] = useState( height );

	const changeSpacerHeight = ( value ) => {
		let spacerHeight = value;
		setSpacerHeight( spacerHeight );
		if ( spacerHeight < minSpacerHeight ) {
			spacerHeight = minSpacerHeight;
		} else if ( spacerHeight > maxSpacerHeight ) {
			spacerHeight = maxSpacerHeight;
		}
		setAttributes( {
			height: spacerHeight,
		} );
	};

	const maximumValue = height > maxSpacerHeight ? height * 2 : maxSpacerHeight;

	return (
		<View style={ [ styles.staticSpacer, isSelected && styles.selectedSpacer, { height } ] }>
			<InspectorControls>
				<PanelBody title={ __( 'SpacerSettings' ) } >
					<BottomSheet.RangeCell
						icon={ 'admin-settings' }
						label={ __( 'Slider' ) }
						value={ sliderSpacerHeight }
						minimumValue={ minSpacerHeight }
						maximumValue={ maximumValue }
						separatorType={ 'fullWidth' }
						onChangeValue={ ( value ) => changeSpacerHeight( value ) }
					/>
				</PanelBody>
			</InspectorControls>
		</View>
	);
};

export default SpacerEdit;
