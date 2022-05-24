/**
 * External dependencies
 */
import { colord, Colord } from 'colord';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Text } from '../text';
import { Spacer } from '../spacer';
import { space } from '../ui/utils/space';
import { ColorHexInputControl } from './styles';
import { COLORS } from '../utils/colors-values';
import { useDraft } from './use-draft';

interface HexInputProps {
	color: Colord;
	onChange: ( nextColor: Colord ) => void;
	enableAlpha: boolean;
}

export const HexInput = ( { color, onChange, enableAlpha }: HexInputProps ) => {
	const formattedValue = color.toHex().slice( 1 ).toUpperCase();

	const draftHookProps = useDraft( {
		value: formattedValue,
		onChange: ( nextValue ) => {
			nextValue = nextValue.replace( /^#/, '' );
			onChange( colord( '#' + nextValue ) );
		},
	} );

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
			{ ...draftHookProps }
			maxLength={ enableAlpha ? 9 : 7 }
			label={ __( 'Hex color' ) }
			hideLabelFromVision
		/>
	);
};
