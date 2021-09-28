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
import { space } from '../utils/space';
import { ColorHexInputControl } from './styles';

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
		<ColorHexInputControl
			prefix={
				<Spacer
					as={ Text }
					marginLeft={ space( 3.5 ) }
					color="blue"
					lineHeight={ 1 }
				>
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
