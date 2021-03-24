/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import { hasBorderFeatureSupport } from './border';
import { cleanEmptyObject } from './utils';

const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUE = 50;

/**
 * Inspector control panel containing the border radius related configuration.
 *
 * @param  {Object} props Block properties.
 * @return {WPElement}    Border radius edit element.
 */
export function BorderRadiusEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( useIsBorderRadiusDisabled( props ) ) {
		return null;
	}

	const onChange = ( newRadius ) => {
		let newStyle = {
			...style,
			border: {
				...style?.border,
				radius: newRadius,
			},
		};

		if ( newRadius === undefined ) {
			newStyle = cleanEmptyObject( newStyle );
		}

		setAttributes( { style: newStyle } );
	};

	return (
		<RangeControl
			value={ style?.border?.radius }
			label={ __( 'Border radius' ) }
			min={ MIN_BORDER_RADIUS_VALUE }
			max={ MAX_BORDER_RADIUS_VALUE }
			initialPosition={ 0 }
			allowReset
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if border radius settings have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}                 Whether border radius setting is disabled.
 */
export function useIsBorderRadiusDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useEditorFeature( 'border.customRadius' );
	return ! hasBorderFeatureSupport( 'radius', blockName ) || isDisabled;
}
