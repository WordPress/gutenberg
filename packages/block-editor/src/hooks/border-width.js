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

const MIN_BORDER_WIDTH = 0;
const MAX_BORDER_WIDTH = 50;

/**
 * Inspector control for configuring border width property.
 *
 * @param  {Object} props  Block properties.
 * @return {WPElement}     Border width edit element.
 */
export const BorderWidthEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( useIsBorderWidthDisabled( props ) ) {
		return null;
	}

	const onChange = ( newWidth ) => {
		const newStyle = {
			...style,
			border: {
				...style?.border,
				width: newWidth,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};

	return (
		<RangeControl
			value={ style?.border?.width }
			label={ __( 'Border width' ) }
			min={ MIN_BORDER_WIDTH }
			max={ MAX_BORDER_WIDTH }
			initialPosition={ 0 }
			allowReset
			onChange={ onChange }
		/>
	);
};

/**
 * Determines if there is border width support.
 *
 * @param  {string|Object} blockType Block name or block type object.
 * @return {boolean}                 Whether there is support.
 */
export const hasBorderWidthSupport = ( blockType ) => {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );
	return !! ( true === support || support?.width );
};

/**
 * Custom hook that checks if border width settings have been disabled.
 *
 * @param  {string} blockName The name of the block to determine support scope.
 * @return {boolean}          Whether or not border width is disabled.
 */
export const useIsBorderWidthDisabled = ( { name: blockName } = {} ) => {
	const isDisabled = ! useEditorFeature( 'border.customWidth' );
	return ! hasBorderWidthSupport( blockName ) || isDisabled;
};
