/**
 * External dependencies
 */
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useId, useState } from '@wordpress/element';

const StyledButton = styled.button`
	font-family: monospace;
	&[aria-pressed='true'] {
		outline: 1px solid red;
	}
`;

/**
 * @template T
 * @typedef {Object} PropSelectorProps
 * @property {string}                         propName        the name of the property
 * @property {{label: string, value: T}[]}    propValues      the list of values to provide controls for
 * @property {T | undefined}                  selectedValue   the currently selected value for this prop
 * @property {(value: T | undefined) => void} onValueSelected the callback fired when a value gets selected
 * @property {boolean=}                       required        Used to show (or hide) an "unset" control
 */

/**
 * @template TValue
 * @param {PropSelectorProps<TValue>} props
 * @return {JSX.Element} The controls used in the e2e test
 */
const PropSelector = ( {
	propName,
	propValues,
	selectedValue,
	onValueSelected,
	required = false,
} ) => {
	const titleId = useId();

	const selectValue = ( newValue ) => {
		onValueSelected( newValue );
	};

	return (
		<div role="group" aria-labelledby={ titleId }>
			<h2 id={ titleId }>{ propName } prop controls</h2>
			{ ! required && (
				<StyledButton
					onClick={ () => selectValue( undefined ) }
					aria-pressed={ selectedValue === undefined }
				>
					Unset
				</StyledButton>
			) }
			{ propValues.map( ( { label, value } ) => (
				<StyledButton
					key={ label }
					onClick={ () => selectValue( value ) }
					aria-pressed={ selectedValue === value }
				>
					{ label }
				</StyledButton>
			) ) }
		</div>
	);
};

export const WithCustomControls = ( Story, context ) => {
	const [ partialProps, setPartialProps ] = useState( {} );

	if ( ! context.args.customE2EControlsProps ) {
		return <Story { ...context } />;
	}

	const contextWithControlledProps = {
		...context,
		// override args with the ones set by custom controls
		args: { ...context.args, ...partialProps },
	};

	const { customE2EControlsProps, ...propsToShow } =
		contextWithControlledProps.args;

	return (
		<>
			<Story { ...contextWithControlledProps } />

			<p>Props:</p>
			<pre>{ JSON.stringify( propsToShow, undefined, 4 ) }</pre>

			{ context.args.customE2EControlsProps.map(
				( { name, required, values } ) => (
					<PropSelector
						key={ name }
						propName={ name }
						required={ required }
						propValues={ Object.entries( values ).map(
							( [ label, value ] ) => ( { label, value } )
						) }
						onValueSelected={ ( newValue ) =>
							setPartialProps( ( oldProps ) => ( {
								...oldProps,
								[ name ]: newValue,
							} ) )
						}
						selectedValue={
							contextWithControlledProps.args[ name ]
						}
					/>
				)
			) }
		</>
	);
};
