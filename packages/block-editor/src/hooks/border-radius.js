/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useEditorFeature from '../components/use-editor-feature';
import { BORDER_SUPPORT_KEY } from './border';
import { cleanEmptyObject } from './utils';

const DEFAULT_MIN_RADIUS = 0;
const DEFAULT_MAX_RADIUS = 50;

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

	const min = useEditorFeature( 'border.minRadius' ) || DEFAULT_MIN_RADIUS;
	const max = useEditorFeature( 'border.maxRadius' ) || DEFAULT_MAX_RADIUS;
	const defaultRadius = useEditorFeature( 'border.defaultRadius' );

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
			min={ min }
			max={ max }
			initialPosition={ defaultRadius || min }
			resetFallbackValue={ defaultRadius }
			allowReset
			onChange={ onChange }
		/>
	);
}

/**
 * Determines if there is border radius support.
 *
 * @param  {string|Object} blockType Block name or Block Type object.
 * @return {boolean}                 Whether there is support.
 */
export function hasBorderRadiusSupport( blockType ) {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );
	return !! ( true === support || support?.radius );
}

/**
 * Custom hook that checks if border radius settings have been disabled.
 *
 * @param  {string} name The name of the block.
 * @return {boolean}                 Whether border radius setting is disabled.
 */
export function useIsBorderRadiusDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useEditorFeature( 'border.customRadius' );
	return ! hasBorderRadiusSupport( blockName ) || isDisabled;
}
