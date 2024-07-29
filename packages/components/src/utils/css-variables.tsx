/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';

type CSSVariableReplacerProps = {
	cssString?: string | null;
	/**
	 * Callback to be called when CSS variables in the given string
	 * have been replaced with their computed values.
	 *
	 * Should be memoized to avoid unnecessary reflows.
	 */
	onChange: ( args: {
		replacedCssString: string;
		computedVariables: ComputedCSSVariables;
	} ) => void;
};
type ComputedCSSVariables = Record< string, string >;
type VarFunction = {
	/** Start index of match. */
	start: number;
	/** End index of match. */
	end: number;
	/** Matched string, e.g. `var( --foo, #000 )`. */
	raw: string;
	/** CSS variable name, e.g. `--foo`. */
	value: string;
	/** Second argument of the `var()`, which could be a literal or another `var()`. */
	fallback?: string;
};

/**
 * Find the index of the matching closing parenthesis for a given opening parenthesis in a string.
 */
function findMatchingParenthesis( str: string, startPos: number ) {
	let stack = 0;

	for ( let i = startPos; i < str.length; i++ ) {
		if ( str[ i ] === '(' ) {
			stack++;
		} else if ( str[ i ] === ')' ) {
			stack--;
			if ( stack === 0 ) {
				return i;
			}
		}
	}

	throw new Error( 'No matching closing parenthesis found.' );
}

/**
 * Find all `var()` functions in a CSS string.
 */
export function findVarFunctionsInString( str: string ) {
	const regex = /(?<=\bvar)\(/g;
	const matches: VarFunction[] = [];

	let openingParen;
	while ( ( openingParen = regex.exec( str ) ) !== null ) {
		const closingParen = findMatchingParenthesis( str, openingParen.index );
		const [ start, end ] = [
			openingParen.index - 'var'.length,
			closingParen + 1,
		];
		const raw = str.slice( start, end );
		const value = raw.match( /--[\w-]+/ )?.[ 0 ];

		if ( ! value ) {
			throw new Error( 'No CSS variable found in var() function.' );
		}

		matches.push( {
			start,
			end,
			raw,
			value,
			fallback: raw.match( /,(.+)\)/ )?.[ 1 ].trim(),
		} );

		regex.lastIndex = closingParen + 1; // resume next regex search after this closing parenthesis
	}

	return matches;
}

/**
 * Get the computed CSS variables for a given element.
 */
function getComputedCSSVariables(
	propertyStrings: string[],
	element: HTMLDivElement
) {
	return propertyStrings.reduce( ( acc, propertyString ) => {
		acc[ propertyString ] = window
			.getComputedStyle( element )
			.getPropertyValue( propertyString );
		return acc;
	}, {} as ComputedCSSVariables );
}

/**
 * Replace all `var()` functions in a CSS string with their computed values.
 */
export function replaceCSSVariablesInString(
	str: string,
	computedVariables: ComputedCSSVariables
): string {
	const varFunctions = findVarFunctionsInString( str );

	let result = '';
	let lastIndex = 0;

	varFunctions.forEach( ( { start, end, value, fallback } ) => {
		const replacement =
			computedVariables[ value ] ||
			replaceCSSVariablesInString( fallback ?? '', computedVariables );

		if ( ! replacement ) {
			throw new Error( `No value found for CSS variable ${ value }.` );
		}

		result += str.slice( lastIndex, start ) + replacement;
		lastIndex = end;
	} );

	result += str.slice( lastIndex );

	return result;
}

/**
 * Find all CSS variable names (e.g. `--foo`) in a string.
 */
export function getCSSVariablesInString( str: string ) {
	return str.match( /(?<=\bvar\(\s*)--[\w-]+/g ) ?? [];
}

/**
 * A component that replaces CSS variables in a given CSS string with their computed values.
 * The result is passed to the `onChange` callback.
 *
 * ```jsx
 * function MyComponent() {
 * 	const onChange = useCallback(
 * 		( { replacedCssString } ) => console.log( replacedCssString ),
 * 		[]
 * 	);
 * 	return (
 * 		<CSSVariableReplacer
 * 			cssString="var(--text-color, red)"
 * 			onChange={ onChange }
 * 		/>
 * 	);
 * }
 * ```
 */
export function CSSVariableReplacer( {
	cssString,
	onChange,
}: CSSVariableReplacerProps ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( cssString && ref.current ) {
			const computedVariables = getComputedCSSVariables(
				getCSSVariablesInString( cssString ),
				ref.current
			);

			let replacedCssString = cssString;

			try {
				replacedCssString = replaceCSSVariablesInString(
					cssString,
					computedVariables
				);
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn(
					'wp.components.CSSVariableReplacer failed to parse the CSS string with error',
					error
				);
			}

			onChange( { replacedCssString, computedVariables } );
		}
	}, [ cssString, onChange ] );

	return (
		<VisuallyHidden>
			<div ref={ ref } />
		</VisuallyHidden>
	);
}
