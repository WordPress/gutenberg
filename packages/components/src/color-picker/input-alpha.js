/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Input from './input';
import { interpolate } from '../utils';
import { AlphaPercentageLabel } from './styles/color-picker-inputs-styles';

function InputAlpha( { onChange = noop, source, value, ...props } ) {
	const inputValue = Math.round( interpolate( value, [ 0, 1 ], [ 0, 100 ] ) );

	const handleOnChange = ( next ) => {
		next.value = interpolate( next.value, [ 0, 100 ], [ 0, 1 ] );

		onChange( next );
	};

	return (
		<Input
			source={ source }
			label={ __( 'alpha' ) }
			labelText="A"
			valueKey="a"
			value={ inputValue }
			onChange={ handleOnChange }
			suffix={ <AlphaPercentageLabel>%</AlphaPercentageLabel> }
			max="100"
			{ ...props }
		/>
	);
}

export default InputAlpha;
