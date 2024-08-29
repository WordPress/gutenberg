/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InputControl } from '../input-control';
import { Text } from '../text';
import { COLORS } from '../utils/colors-values';
import type { StateReducer } from '../input-control/reducer/state';
import type { HexInputProps } from './types';
import InputControlPrefixWrapper from '../input-control/input-prefix-wrapper';

export const HexInput = ( { color, onChange, enableAlpha }: HexInputProps ) => {
	const handleChange = ( nextValue: string | undefined ) => {
		if ( ! nextValue ) {
			return;
		}
		const hexValue = nextValue.startsWith( '#' )
			? nextValue
			: '#' + nextValue;

		onChange( colord( hexValue ) );
	};

	const stateReducer: StateReducer = ( state, action ) => {
		const nativeEvent = action.payload?.event?.nativeEvent as InputEvent;

		if ( 'insertFromPaste' !== nativeEvent?.inputType ) {
			return { ...state };
		}

		const value = state.value?.startsWith( '#' )
			? state.value.slice( 1 ).toUpperCase()
			: state.value?.toUpperCase();

		return { ...state, value };
	};

	return (
		<InputControl
			prefix={
				<InputControlPrefixWrapper>
					<Text color={ COLORS.theme.accent } lineHeight={ 1 }>
						#
					</Text>
				</InputControlPrefixWrapper>
			}
			value={ color.toHex().slice( 1 ).toUpperCase() }
			onChange={ handleChange }
			maxLength={ enableAlpha ? 9 : 7 }
			label={ __( 'Hex color' ) }
			hideLabelFromVision
			size="__unstable-large"
			__unstableStateReducer={ stateReducer }
			__unstableInputWidth="9em"
		/>
	);
};
