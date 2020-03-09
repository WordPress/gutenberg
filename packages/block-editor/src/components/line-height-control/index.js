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
	useLineHeightState,
	isLineHeightDefined,
} from './utils';
import { LineHeightControlWrapper } from './styles';

export {
	getLineHeightControlStyles,
	getLineHeightControlClassName,
} from './utils';
export { default as withLineHeight } from './with-line-height';

export default function LineHeightControl( props ) {
	const [ lineHeight, setLineHeight ] = useLineHeightState();

	const handleOnChange = ( nextValue ) => {
		// Set the next value as normal if lineHeight has been defined
		if ( isLineHeightDefined( lineHeight ) ) {
			return setLineHeight( parseFloat( nextValue ) );
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

	return (
		<LineHeightControlWrapper>
			<TextControl
				autoComplete="off"
				onChange={ handleOnChange }
				label={ __( 'Line height' ) }
				placeholder={ BASE_DEFAULT_VALUE }
				step={ STEP }
				type="number"
				value={ lineHeight || INITIAL_VALUE }
				{ ...props }
				min={ 0 }
			/>
		</LineHeightControlWrapper>
	);
}
