/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';

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
		name: blockName,
		attributes: { style },
	} = props;

	if ( ! hasBlockSupport( blockName, LINE_HEIGHT_SUPPORT_KEY ) ) {
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
	return Platform.select( {
		web: (
			<LineHeightControl
				value={ style?.typography?.lineHeight }
				onChange={ onChange }
			/>
		),
		native: null,
	} );
}
