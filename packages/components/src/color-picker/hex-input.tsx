/**
 * External dependencies
 */
import { colord, Colord } from 'colord';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { ClipboardEvent } from 'react';

/**
 * Internal dependencies
 */
import { Text } from '../text';
import { Spacer } from '../spacer';
import { space } from '../ui/utils/space';
import { ColorHexInputControl } from './styles';
import { COLORS } from '../utils/colors-values';

interface HexInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export const HexInput = ( { color, onChange, enableAlpha }: HexInputProps ) => {
	const handleChange = ( nextValue: string | undefined ) => {
		if ( ! nextValue ) return;
		const hexValue = nextValue.startsWith( '#' )
			? nextValue
			: '#' + nextValue;

		onChange( colord( hexValue ) );
	};
	const handlePaste = ( event: ClipboardEvent ) => {
		const pastedContent = event.clipboardData.getData( 'Text' );
		handleChange( pastedContent );
	};
	const handleValidate = ( value: string ) => {
		const hexValue = value.startsWith( '#' ) ? value : '#' + value;
		if ( ! colord( hexValue ).isValid() ) {
			throw new Error( 'Invalid hex color input' );
		}
	};

	return (
		<ColorHexInputControl
			prefix={
				<Spacer
					as={ Text }
					marginLeft={ space( 3.5 ) }
					color={ COLORS.ui.theme }
					lineHeight={ 1 }
				>
					#
				</Spacer>
			}
			value={ color.toHex().slice( 1 ).toUpperCase() }
			onChange={ handleChange }
			onPaste={ handlePaste }
			onValidate={ handleValidate }
			isPressEnterToChange={ true }
			maxLength={ enableAlpha ? 8 : 6 }
			label={ __( 'Hex color' ) }
			hideLabelFromVision
		/>
	);
};
