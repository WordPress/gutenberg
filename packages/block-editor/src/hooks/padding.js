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
			paddingTop: `${ top[ 0 ] }${ top[ 1 ] }`,
			paddingRight: `${ right[ 0 ] }${ right[ 1 ] }`,
			paddingBottom: `${ bottom[ 0 ] }${ bottom[ 1 ] }`,
			paddingLeft: `${ left[ 0 ] }${ left[ 1 ] }`,
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
