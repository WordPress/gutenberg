/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ComponentProps } from 'react';
import { RgbaColorPicker as Picker } from 'react-colorful';
import colorize from 'tinycolor2';

/**
 * Internal dependencies
 */
import { ColorfulWrapper } from './styles';

type PickerProps = ComponentProps< typeof Picker >;
interface OwnProps {
	onChange: ( hexColor: string ) => void;
	color?: string;
}

export const RgbaColorPicker = ( {
	onChange,
	color,
	...props
}: Omit< PickerProps, keyof OwnProps > & OwnProps ) => (
	<ColorfulWrapper>
		<Picker
			{ ...props }
			onChange={ ( newColor ) =>
				onChange( colorize( newColor ).toHex8String() )
			}
			color={ colorize( color ).toRgb() }
		/>
	</ColorfulWrapper>
);
