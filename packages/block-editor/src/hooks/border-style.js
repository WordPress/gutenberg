/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BorderStyleControl from '../components/border-style-control';
import useEditorFeature from '../components/use-editor-feature';
import { BORDER_SUPPORT_KEY } from './border';
import { cleanEmptyObject } from './utils';

/**
 * Inspector control for configuring border style property.
 *
 * @param  {Object} props  Block properties.
 * @return {WPElement}     Border style edit element.
 */
export const BorderStyleEdit = ( props ) => {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	if ( useIsBorderStyleDisabled( props ) ) {
		return null;
	}

	const onChange = ( newBorderStyle ) => {
		const newStyleAttributes = {
			...style,
			border: {
				...style?.border,
				style: newBorderStyle,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyleAttributes ) } );
	};

	return (
		<BorderStyleControl
			value={ style?.border?.style }
			onChange={ onChange }
		/>
	);
};

/**
 * Determines if there is border style support.
 *
 * @param  {string|Object} blockType Block name or block type object.
 * @return {boolean}                 Whether there is support.
 */
export const hasBorderStyleSupport = ( blockType ) => {
	const support = getBlockSupport( blockType, BORDER_SUPPORT_KEY );
	return !! ( true === support || support?.style );
};

/**
 * Custom hook that checks if border style settings have been disabled.
 *
 * @param  {string} blockName The name of the block to determine support scope.
 * @return {boolean}          Whether or not border style is disabled.
 */
export const useIsBorderStyleDisabled = ( { name: blockName } = {} ) => {
	const isDisabled = ! useEditorFeature( 'border.customStyle' );
	return ! hasBorderStyleSupport( blockName ) || isDisabled;
};
