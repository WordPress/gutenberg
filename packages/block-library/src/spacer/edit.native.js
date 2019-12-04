
/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import {
	StepperControl,
	PanelBody,
} from '@wordpress/components';
import { withPreferredColorScheme } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
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

const SpacerEdit = ( { isSelected, attributes, setAttributes, getStylesFromColorScheme } ) => {
	const { height } = attributes;
	const [ sliderSpacerMaxHeight, setSpacerMaxHeight ] = useState( height );

	// Height defined on the web can be higher than
	// `maxSpacerHeight`, so there is a need to `setSpacerMaxHeight`
	// after the initial render.
	useEffect( () => {
		setSpacerMaxHeight( height > maxSpacerHeight ? height * 2 : maxSpacerHeight );
	}, [] );

	const changeAttribute = ( value ) => {
		setAttributes( {
			height: value,
		} );
	};

	const defaultStyle = getStylesFromColorScheme( styles.staticSpacer, styles.staticDarkSpacer );

	return (
		<View style={ [ defaultStyle, isSelected && styles.selectedSpacer, { height } ] }>
			<InspectorControls>
				<PanelBody title={ __( 'Spacer Settings' ) } >
					<StepperControl
						icon="screenoptions"
						label={ __( 'Height in pixels' ) }
						maxValue={ sliderSpacerMaxHeight }
						minValue={ minSpacerHeight }
						onChangeValue={ changeAttribute }
						value={ height }
						step={ 20 }
					/>
				</PanelBody>
			</InspectorControls>
		</View>
	);
};

export default withPreferredColorScheme( SpacerEdit );
