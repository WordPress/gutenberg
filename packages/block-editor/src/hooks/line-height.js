/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import LineHeightControl from '../components/line-height-control';
import { cleanEmptyObject } from './utils';
import useSetting from '../components/use-setting';

export const LINE_HEIGHT_SUPPORT_KEY = 'typography.lineHeight';

/**
 * Inspector control panel containing the line height related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Line height edit element.
 */
export function LineHeightEdit( props ) {
	const {
		attributes: { style },
		setAttributes,
	} = props;

	const onChange = ( newLineHeightValue ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				lineHeight: newLineHeightValue,
			},
		};

		setAttributes( { style: cleanEmptyObject( newStyle ) } );
	};
	return (
		<LineHeightControl
			__unstableInputWidth="100%"
			__nextHasNoMarginBottom={ true }
			value={ style?.typography?.lineHeight }
			onChange={ onChange }
		/>
	);
}

/**
 * Custom hook that checks if line-height settings have been disabled.
 *
 * @param {string} name The name of the block.
 * @return {boolean} Whether setting is disabled.
 */
export function useIsLineHeightDisabled( { name: blockName } = {} ) {
	const isDisabled = ! useSetting( 'typography.lineHeight' );

	return (
		! hasBlockSupport( blockName, LINE_HEIGHT_SUPPORT_KEY ) || isDisabled
	);
}

/**
 * Checks if there is a current value set for the line height block support.
 *
 * @param {Object} props Block props.
 * @return {boolean}     Whether or not the block has a line height value set.
 */
export function hasLineHeightValue( props ) {
	return !! props.attributes.style?.typography?.lineHeight;
}

/**
 * Resets the line height block support attribute. This can be used when
 * disabling the line height support controls for a block via a progressive
 * discovery panel.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 */
export function resetLineHeight( { attributes = {}, setAttributes } ) {
	const { style } = attributes;

	setAttributes( {
		style: cleanEmptyObject( {
			...style,
			typography: {
				...style?.typography,
				lineHeight: undefined,
			},
		} ),
	} );
}
