/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ComponentProps } from 'react';
import { HslaColorPicker as Picker } from 'react-colorful';
import colorize from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ColorfulWrapper } from './styles';

type PickerProps = ComponentProps< typeof Picker >;
interface OwnProps {
	onChange: ( hexColor: string ) => void;
	color?: string;
}

export const HslaColorPicker = ( {
	onChange,
	color,
	...props
}: Omit< PickerProps, keyof OwnProps > & OwnProps ) => {
	const [ hslaColor, setHslaColor ] = useState( () =>
		colorize( color ).toHsl()
	);

	useEffect( () => {
		onChange( colorize( hslaColor ).toHex8String() );
	}, [ hslaColor, onChange ] );

	return (
		<ColorfulWrapper>
			<Picker
				{ ...props }
				onChange={ setHslaColor }
				color={ hslaColor }
			/>
		</ColorfulWrapper>
	);
};
