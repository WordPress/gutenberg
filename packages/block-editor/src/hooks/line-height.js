/**
 * WordPress dependencies
 */
import { Platform } from '@wordpress/element';

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
	const { style } = props.attributes;
	const onChange = ( newLineHeightValue ) => {
		const newStyle = {
			...style,
			typography: {
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
