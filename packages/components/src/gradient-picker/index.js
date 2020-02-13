/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CircularOptionPicker from '../circular-option-picker';
import CustomGradientPicker from '../custom-gradient-picker';

export default function GradientPicker( {
	className,
	gradients,
	onChange,
	value,
	clearable = true,
	disableCustomGradients = false,
} ) {
	const clearGradient = useCallback( () => onChange( undefined ), [
		onChange,
	] );
	const gradientOptions = useMemo( () => {
		return map( gradients, ( { gradient, name } ) => (
			<CircularOptionPicker.Option
				key={ gradient }
				value={ gradient }
				isSelected={ value === gradient }
				tooltipText={
					name ||
					// translators: %s: gradient code e.g: "linear-gradient(90deg, rgba(98,16,153,1) 0%, rgba(172,110,22,1) 100%);".
					sprintf( __( 'Gradient code: %s' ), gradient )
				}
				style={ { color: 'rgba( 0,0,0,0 )', background: gradient } }
				onClick={
					value === gradient
						? clearGradient
						: () => onChange( gradient )
				}
				aria-label={
					name
						? // translators: %s: The name of the gradient e.g: "Angular red to blue".
						  sprintf( __( 'Gradient: %s' ), name )
						: // translators: %s: gradient code e.g: "linear-gradient(90deg, rgba(98,16,153,1) 0%, rgba(172,110,22,1) 100%);".
						  sprintf( __( 'Gradient code: %s' ), gradient )
				}
			/>
		) );
	}, [ gradients, value, onChange, clearGradient ] );
	return (
		<CircularOptionPicker
			className={ className }
			options={ gradientOptions }
			actions={
				clearable && (
					<CircularOptionPicker.ButtonAction
						onClick={ clearGradient }
					>
						{ __( 'Clear' ) }
					</CircularOptionPicker.ButtonAction>
				)
			}
		>
			{ ! disableCustomGradients && (
				<CustomGradientPicker value={ value } onChange={ onChange } />
			) }
		</CircularOptionPicker>
	);
}
