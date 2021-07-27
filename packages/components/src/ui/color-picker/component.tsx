/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	useContextSystem,
	contextConnect,
	PolymorphicComponentProps,
} from '../context';
import { HStack } from '../../h-stack';
import Button from '../../button';
import { ColorfulWrapper, SelectControl } from './styles';
import { HexColorPicker } from './hex-color-picker';
import { HslaColorPicker } from './hsla-color-picker';
import { ColorDisplay } from './color-display';
import { ColorInput } from './color-input';

interface ColorPickerProps {
	disableAlpha?: boolean;
	initialColor?: string;
}

type ColorType = 'rgb' | 'hsl' | 'hex';

const options = [
	{ label: 'RGB', value: 'rgb' as const },
	{ label: 'HSL', value: 'hsl' as const },
	{ label: 'Hex', value: 'hex' as const },
];

const ColorPicker = (
	props: PolymorphicComponentProps< ColorPickerProps, 'div', false >,
	forwardedRef: Ref< any >
) => {
	const { disableAlpha = true, initialColor } = useContextSystem(
		props,
		'ColorPicker'
	);

	const [ showInputs, setShowInputs ] = useState< boolean >( false );
	const [ colorType, setColorType ] = useState< ColorType >( 'rgb' );

	const [ color, setColor ] = useState(
		initialColor || ( disableAlpha ? '#000000' : '#000000ff' )
	);

	const Picker = disableAlpha ? HexColorPicker : HslaColorPicker;

	return (
		<ColorfulWrapper ref={ forwardedRef }>
			<Picker onChange={ setColor } color={ color } />
			<HStack>
				{ showInputs ? (
					<SelectControl
						options={ options }
						value={ colorType }
						onChange={ ( nextColorType ) =>
							setColorType( nextColorType as ColorType )
						}
					/>
				) : (
					<ColorDisplay color={ color } colorType={ colorType } />
				) }
				<Button
					onClick={ () => setShowInputs( ! showInputs ) }
					icon={ moreVertical }
					isPressed={ showInputs }
				></Button>
			</HStack>
			{ showInputs && (
				<ColorInput
					colorType={ colorType }
					color={ color }
					onChange={ setColor }
				/>
			) }
		</ColorfulWrapper>
	);
};

const ConnectedColorPicker = contextConnect( ColorPicker, 'ColorPicker' );

export default ConnectedColorPicker;
