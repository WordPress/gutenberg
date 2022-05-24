/**
 * External dependencies
 */
import { colord, Colord } from 'colord';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';

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

type DraftState = {
	value?: string;
	isStale?: boolean;
};

export const HexInput = ( { color, onChange, enableAlpha }: HexInputProps ) => {
	const formattedValue = color.toHex().slice( 1 ).toUpperCase();
	const refPreviousFormattedValue = useRef( formattedValue );
	const [ draft, setDraft ] = useState< DraftState >( {} );
	const usedValue = draft.value !== undefined ? draft.value : formattedValue;

	// Determines when to discard the draft value to restore controlled status.
	// To do so, it tracks the previous formatted value and marks the draft
	// value as stale after each render.
	useEffect( () => {
		const { current: previousFormattedValue } = refPreviousFormattedValue;
		refPreviousFormattedValue.current = formattedValue;
		if ( draft.value !== undefined && ! draft.isStale )
			setDraft( { ...draft, isStale: true } );
		else if ( draft.isStale && formattedValue !== previousFormattedValue )
			setDraft( {} );
	}, [ formattedValue, draft.isStale, draft.value ] );

	const handleChange = ( nextValue: string | undefined ) => {
		if ( ! nextValue ) return;
		nextValue = nextValue.replace( /^#/, '' );
		// Mutates the draft value to avoid an extra render and effect run.
		setDraft( ( current ) =>
			Object.assign( current, { value: nextValue, isStale: false } )
		);
		onChange( colord( '#' + nextValue ) );
	};
	const handleBlur = () => setDraft( {} );

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
			value={ usedValue }
			onBlur={ handleBlur }
			onChange={ handleChange }
			maxLength={ enableAlpha ? 9 : 7 }
			label={ __( 'Hex color' ) }
			hideLabelFromVision
		/>
	);
};
