/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	BASE_DEFAULT_VALUE,
	INITIAL_VALUE,
	STEP,
	useLineHeightControlState,
	isLineHeightDefined,
} from './utils';
import { LineHeightControlWrapper } from './styles';

export { default as withLineHeight } from './with-line-height';

export default function LineHeightControl( props ) {
	const [ lineHeight, setLineHeight ] = useLineHeightControlState();

	const handleOnChange = ( nextValue ) => {
		// Set the next value without modification if lineHeight has been defined
		if ( isLineHeightDefined( lineHeight ) ) {
			setLineHeight( nextValue );
			return;
		}

		// Otherwise...
		let adjustedNextValue = nextValue;

		switch ( nextValue ) {
			case `${ STEP }`:
				// Increment by step value
				adjustedNextValue = BASE_DEFAULT_VALUE + STEP;
				break;
			case '0':
				// Decrement by step value
				adjustedNextValue = BASE_DEFAULT_VALUE - STEP;
				break;
		}

		setLineHeight( adjustedNextValue );
	};

	const value = lineHeight || INITIAL_VALUE;

	return (
		<LineHeightControlWrapper>
			<TextControl
				autoComplete="off"
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ value }
				{ ...props }
				min={ 0 }
			/>
		</LineHeightControlWrapper>
	);
}
