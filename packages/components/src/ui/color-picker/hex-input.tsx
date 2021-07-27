/**
 * External dependencies
 */
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { Text } from '../../text';
import { Spacer } from '../../spacer';
import InputControl from '../../input-control';
import { space } from '../utils/space';

interface HexInputProps {
	color: string;
	onChange: ( value: string ) => void;
}

export const HexInput = ( { color, onChange }: HexInputProps ) => {
	const handleValidate = ( value: string ) => {
		if ( ! colorize( value ).isValid() ) {
			throw new Error( 'Invalid hex color input' );
		}
	};

	return (
		<InputControl
			__unstableInputWidth="7em"
			suffix={
				<Spacer as={ Text } marginX={ space( 2 ) } color="blue">
					#
				</Spacer>
			}
			value={ color.slice( 1 ) }
			onChange={ ( nextValue ) =>
				onChange( colorize( nextValue ).toHex8String() )
			}
			onValidate={ handleValidate }
		/>
	);
};
