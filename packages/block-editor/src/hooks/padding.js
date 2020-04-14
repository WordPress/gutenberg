/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Platform } from '@wordpress/element';
import { hasBlockSupport } from '@wordpress/blocks';
import { __experimentalBoxControl as BoxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';

export const PADDING_SUPPORT_KEY = '__experimentalPadding';

/**
 * Inspector control panel containing the line height related configuration
 *
 * @param {Object} props
 *
 * @return {WPElement} Line height edit element.
 */
export function PaddingEdit( props ) {
	const {
		name: blockName,
		attributes: { padding, style },
		setAttributes,
	} = props;

	if ( ! hasBlockSupport( blockName, PADDING_SUPPORT_KEY ) ) {
		return null;
	}

	const onChange = ( next ) => {
		const { top, right, bottom, left } = next;

		const newStyle = {
			...style,
			padding: {
				top: `${ top[ 0 ] }${ top[ 1 ] }`,
				right: `${ right[ 0 ] }${ right[ 1 ] }`,
				bottom: `${ bottom[ 0 ] }${ bottom[ 1 ] }`,
				left: `${ left[ 0 ] }${ left[ 1 ] }`,
			},
		};

		setAttributes( {
			padding: next,
			style: cleanEmptyObject( newStyle ),
		} );
	};

	return Platform.select( {
		web: (
			<BoxControl
				values={ padding }
				onChange={ onChange }
				label={ __( 'Padding' ) }
			/>
		),
		native: null,
	} );
}

export const paddingStyleMappings = {
	'--wp--padding-top': [ 'padding', 'top' ],
	'--wp--padding-right': [ 'padding', 'right' ],
	'--wp--padding-bottom': [ 'padding', 'bottom' ],
	'--wp--padding-left': [ 'padding', 'left' ],
};
