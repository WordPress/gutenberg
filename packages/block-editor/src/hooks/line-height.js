/**
 * WordPress dependencies
 */
import { hasBlockSupport } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import LineHeightControl from '../components/line-height-control';
import { cleanEmptyObject } from './utils';

export const LINE_HEIGHT_SUPPORT_KEY = '__experimentalLineHeight';

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
	const isDisabled = useSelect( ( select ) => {
		const editorSettings = select( 'core/block-editor' ).getSettings();

		return editorSettings.__experimentalDisableCustomLineHeight;
	} );

	return (
		! hasBlockSupport( blockName, LINE_HEIGHT_SUPPORT_KEY ) || isDisabled
	);
}
