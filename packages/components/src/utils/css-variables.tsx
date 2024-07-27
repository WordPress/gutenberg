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
	onChange: ( args: {
		replacedCssString: string;
		computedVariables: ComputedCSSVariables;
	} ) => void;
};
type ComputedCSSVariables = Record< string, string >;

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

export function findVarFunctionsInString( str: string ) {
	const regex = /(?<=\bvar)\(/g;
	const matches = [];

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

		regex.lastIndex = closingParen + 1;
	}

	return matches;
}

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

export function replaceCSSVariablesInString(
	str: string,
	computedVariables: ComputedCSSVariables
): string {
	const varFunctions = findVarFunctionsInString( str );

	let result = '';
	let lastIndex = 0;

	varFunctions.forEach( ( { start, end, value, fallback } ) => {
		const replacement =
			computedVariables[ value ] ??
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

export function CSSVariableReplacer( {
	cssString,
	onChange,
}: CSSVariableReplacerProps ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( cssString && ref.current ) {
			const varFunctions = findVarFunctionsInString( cssString );
			const computedVariables = getComputedCSSVariables(
				varFunctions.map( ( { value } ) => value ),
				ref.current
			);

			onChange( {
				replacedCssString: replaceCSSVariablesInString(
					cssString,
					computedVariables
				),
				computedVariables,
			} );
		}
	}, [ cssString, onChange ] );

	return (
		<VisuallyHidden>
			<div ref={ ref } />
		</VisuallyHidden>
	);
}
