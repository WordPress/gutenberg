/**
 * External dependencies
 */
import colorize, { ColorFormats } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Spacer } from '../../spacer';
import InputControl from '../../input-control';
import { space } from '../utils/space';

interface HexInputProps {
	color: ColorFormats.HSLA;
	onChange: ( value: ColorFormats.HSLA ) => void;
	enableAlpha: boolean;
}

export const HexInput = ( { color, onChange, enableAlpha }: HexInputProps ) => {
	const handleValidate = ( value: string ) => {
		if ( ! colorize( value ).isValid() ) {
			throw new Error( 'Invalid hex color input' );
		}
	};

	const colorized = colorize( color );
	const value = enableAlpha
		? colorized.toHex8String()
		: colorized.toHexString();

	return (
		<InputControl
			__unstableInputWidth="8em"
			prefix={
				<Spacer as={ Text } marginLeft={ space( 2 ) } color="blue">
					#
				</Spacer>
			}
			value={ value.slice( 1 ).toUpperCase() }
			onChange={ ( nextValue ) =>
				onChange( colorize( nextValue ).toHsl() )
			}
			onValidate={ handleValidate }
			maxLength={ enableAlpha ? 8 : 6 }
			label={ __( 'Hex color' ) }
			hideLabelFromVision
		/>
	);
};
