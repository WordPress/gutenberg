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

export const LINE_HEIGHT_SUPPORT_KEY = 'lineHeight';

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
	} = props;
	const isDisabled = useIsLineHeightDisabled( props );

	if ( isDisabled ) {
		return null;
	}

	const onChange = ( newLineHeightValue ) => {
		const newStyle = {
			...style,
			typography: {
				...style?.typography,
				lineHeight: newLineHeightValue,
			},
		};
		props.setAttributes( {
			style: cleanEmptyObject( newStyle ),
		} );
	};
	return (
		<LineHeightControl
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
	const isDisabled = ! useSetting( 'typography.customLineHeight' );

	return (
		! hasBlockSupport( blockName, LINE_HEIGHT_SUPPORT_KEY ) || isDisabled
	);
}
