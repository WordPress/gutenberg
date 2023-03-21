/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import CircularOptionPicker from '../circular-option-picker';
import CustomGradientPicker from '../custom-gradient-picker';
import { VStack } from '../v-stack';
import { ColorHeading } from '../color-palette/styles';
import { Spacer } from '../spacer';

function SingleOrigin( {
	className,
	clearGradient,
	gradients,
	onChange,
	value,
	actions,
} ) {
	const gradientOptions = useMemo( () => {
		return gradients.map( ( { gradient, name }, index ) => (
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
						: () => onChange( gradient, index )
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
			actions={ actions }
		/>
	);
}

function MultipleOrigin( {
	className,
	clearGradient,
	gradients,
	onChange,
	value,
	actions,
} ) {
	return (
		<VStack spacing={ 3 } className={ className }>
			{ gradients.map( ( { name, gradients: gradientSet }, index ) => {
				return (
					<VStack spacing={ 2 } key={ index }>
						<ColorHeading>{ name }</ColorHeading>
						<SingleOrigin
							clearGradient={ clearGradient }
							gradients={ gradientSet }
							onChange={ ( gradient ) =>
								onChange( gradient, index )
							}
							value={ value }
							{ ...( gradients.length === index + 1
								? { actions }
								: {} ) }
						/>
					</VStack>
				);
			} ) }
		</VStack>
	);
}

export default function GradientPicker( {
	/** Start opting into the new margin-free styles that will become the default in a future version. */
	__nextHasNoMargin = false,
	className,
	gradients,
	onChange,
	value,
	clearable = true,
	disableCustomGradients = false,
	__experimentalIsRenderedInSidebar,
} ) {
	const clearGradient = useCallback(
		() => onChange( undefined ),
		[ onChange ]
	);
	const Component =
		gradients?.length && gradients[ 0 ].gradients
			? MultipleOrigin
			: SingleOrigin;

	if ( ! __nextHasNoMargin ) {
		deprecated( 'Outer margin styles for wp.components.GradientPicker', {
			since: '6.1',
			version: '6.4',
			hint: 'Set the `__nextHasNoMargin` prop to true to start opting into the new styles, which will become the default in a future version',
		} );
	}

	const deprecatedMarginSpacerProps = ! __nextHasNoMargin
		? {
				marginTop: ! gradients?.length ? 3 : undefined,
				marginBottom: ! clearable ? 6 : 0,
		  }
		: {};

	return (
		// Outmost Spacer wrapper can be removed when deprecation period is over
		<Spacer marginBottom={ 0 } { ...deprecatedMarginSpacerProps }>
			<VStack spacing={ gradients?.length ? 4 : 0 }>
				{ ! disableCustomGradients && (
					<CustomGradientPicker
						__nextHasNoMargin
						__experimentalIsRenderedInSidebar={
							__experimentalIsRenderedInSidebar
						}
						value={ value }
						onChange={ onChange }
					/>
				) }
				{ ( gradients?.length || clearable ) && (
					<Component
						className={ className }
						clearable={ clearable }
						clearGradient={ clearGradient }
						gradients={ gradients }
						onChange={ onChange }
						value={ value }
						actions={
							clearable &&
							! disableCustomGradients && (
								<CircularOptionPicker.ButtonAction
									onClick={ clearGradient }
								>
									{ __( 'Clear' ) }
								</CircularOptionPicker.ButtonAction>
							)
						}
					/>
				) }
			</VStack>
		</Spacer>
	);
}
