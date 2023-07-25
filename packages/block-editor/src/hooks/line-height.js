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
			size="__unstable-large"
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
