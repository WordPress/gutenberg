/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CircularOptionPicker from '../circular-option-picker';
import CustomGradientPicker from '../custom-gradient-picker';
import { VStack } from '../v-stack';
import { ColorHeading } from '../color-palette/styles';
import type {
	GradientPickerComponentProps,
	PickerProps,
	OriginObject,
	GradientObject,
} from './types';

// The Multiple Origin Gradients have a `gradients` property (an array of
// gradient objects), while Single Origin ones have a `gradient` property.
const isMultipleOriginObject = (
	obj: Record< string, any >
): obj is OriginObject =>
	Array.isArray( obj.gradients ) && ! ( 'gradient' in obj );

const isMultipleOriginArray = ( arr: any[] ): arr is OriginObject[] => {
	return (
		arr.length > 0 &&
		arr.every( ( gradientObj ) => isMultipleOriginObject( gradientObj ) )
	);
};

function SingleOrigin( {
	className,
	clearGradient,
	gradients,
	onChange,
	value,
	...additionalProps
}: PickerProps< GradientObject > ) {
	const gradientOptions = useMemo( () => {
		return gradients.map( ( { gradient, name, slug }, index ) => (
			<CircularOptionPicker.Option
				key={ slug }
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
		<CircularOptionPicker.OptionGroup
			className={ className }
			options={ gradientOptions }
			{ ...additionalProps }
		/>
	);
}

function MultipleOrigin( {
	className,
	clearGradient,
	gradients,
	onChange,
	value,
	headingLevel,
}: PickerProps< OriginObject > ) {
	const instanceId = useInstanceId( MultipleOrigin );

	return (
		<VStack spacing={ 3 } className={ className }>
			{ gradients.map( ( { name, gradients: gradientSet }, index ) => {
				const id = `color-palette-${ instanceId }-${ index }`;
				return (
					<VStack spacing={ 2 } key={ index }>
						<ColorHeading level={ headingLevel } id={ id }>
							{ name }
						</ColorHeading>
						<SingleOrigin
							clearGradient={ clearGradient }
							gradients={ gradientSet }
							onChange={ ( gradient ) =>
								onChange( gradient, index )
							}
							value={ value }
							aria-labelledby={ id }
						/>
					</VStack>
				);
			} ) }
		</VStack>
	);
}

function Component( props: PickerProps< any > ) {
	const {
		asButtons,
		loop,
		actions,
		headingLevel,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		...additionalProps
	} = props;
	const options = isMultipleOriginArray( props.gradients ) ? (
		<MultipleOrigin headingLevel={ headingLevel } { ...additionalProps } />
	) : (
		<SingleOrigin { ...additionalProps } />
	);

	let metaProps:
		| { asButtons: false; loop?: boolean; 'aria-label': string }
		| { asButtons: false; loop?: boolean; 'aria-labelledby': string }
		| { asButtons: true };

	if ( asButtons ) {
		metaProps = { asButtons: true };
	} else {
		const _metaProps: { asButtons: false; loop?: boolean } = {
			asButtons: false,
			loop,
		};

		if ( ariaLabel ) {
			metaProps = { ..._metaProps, 'aria-label': ariaLabel };
		} else if ( ariaLabelledby ) {
			metaProps = {
				..._metaProps,
				'aria-labelledby': ariaLabelledby,
			};
		} else {
			metaProps = {
				..._metaProps,
				'aria-label': __( 'Custom color picker.' ),
			};
		}
	}

	return (
		<CircularOptionPicker
			{ ...metaProps }
			actions={ actions }
			options={ options }
		/>
	);
}

/**
 *  GradientPicker is a React component that renders a color gradient picker to
 * define a multi step gradient. There's either a _linear_ or a _radial_ type
 * available.
 *
 * ```jsx
 *import { GradientPicker } from '@wordpress/components';
 *import { useState } from '@wordpress/element';
 *
 *const myGradientPicker = () => {
 *	const [ gradient, setGradient ] = useState( null );
 *
 *	return (
 *		<GradientPicker
 *			value={ gradient }
 *			onChange={ ( currentGradient ) => setGradient( currentGradient ) }
 *			gradients={ [
 *				{
 *					name: 'JShine',
 *					gradient:
 *						'linear-gradient(135deg,#12c2e9 0%,#c471ed 50%,#f64f59 100%)',
 *					slug: 'jshine',
 *				},
 *				{
 *					name: 'Moonlit Asteroid',
 *					gradient:
 *						'linear-gradient(135deg,#0F2027 0%, #203A43 0%, #2c5364 100%)',
 *					slug: 'moonlit-asteroid',
 *				},
 *				{
 *					name: 'Rastafarie',
 *					gradient:
 *						'linear-gradient(135deg,#1E9600 0%, #FFF200 0%, #FF0000 100%)',
 *					slug: 'rastafari',
 *				},
 *			] }
 *		/>
 *	);
 *};
 *```
 *
 */
export function GradientPicker( {
	className,
	gradients = [],
	onChange,
	value,
	clearable = true,
	disableCustomGradients = false,
	__experimentalIsRenderedInSidebar,
	headingLevel = 2,
	...additionalProps
}: GradientPickerComponentProps ) {
	const clearGradient = useCallback(
		() => onChange( undefined ),
		[ onChange ]
	);

	return (
		<VStack spacing={ gradients.length ? 4 : 0 }>
			{ ! disableCustomGradients && (
				<CustomGradientPicker
					__experimentalIsRenderedInSidebar={
						__experimentalIsRenderedInSidebar
					}
					value={ value }
					onChange={ onChange }
				/>
			) }
			{ ( gradients.length > 0 || clearable ) && (
				<Component
					{ ...additionalProps }
					className={ className }
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
					headingLevel={ headingLevel }
				/>
			) }
		</VStack>
	);
}

export default GradientPicker;
