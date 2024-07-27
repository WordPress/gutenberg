/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';

type CSSVariableGetterProps = {
	cssString?: string | null;
	onChange: ( cssVariables: CSSVariables ) => void;
};
type CSSVariables = Record< string, string >;

export function getCSSVariablesInString( cssString: string ) {
	return cssString.match( /(?<=\bvar\(\s*)--[\w-]+/g ) ?? [];
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
	}, {} as CSSVariables );
}

export function replaceCSSVariablesInString(
	cssString: string,
	cssVariables: CSSVariables
): string {
	const getRegexForNestingLevel = ( fallbackCount: number ) => {
		const closingParens =
			fallbackCount > 1 ? '\\)'.repeat( fallbackCount - 1 ) : '';
		return new RegExp(
			'var\\((\\s*--[\\w-]+)\\s*(?:,([^)]+' + closingParens + '))?\\s*\\)'
		);
	};

	const baseRegex = /var\((\s*--[\w-]+)(?:\s*,([^)]+))?\s*\)/g;
	const nestedRegexes = cssString.match( baseRegex )?.map( ( match ) => {
		const fallbacksInMatch = match.match( /,/g )?.length ?? 0;
		return getRegexForNestingLevel( fallbacksInMatch );
	} );

	const result = nestedRegexes?.reduce( ( acc, regex ) => {
		return acc.replace( regex, ( match, variable, fallback ) => {
			const value = cssVariables[ variable ];
			if ( value ) {
				return value;
			}
			return fallback
				? replaceCSSVariablesInString( fallback.trim(), cssVariables )
				: match;
		} );
	}, cssString );

	return result ?? cssString;
}

export function CSSVariableGetter( {
	cssString,
	onChange,
}: CSSVariableGetterProps ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( cssString && ref.current ) {
			const propertyStrings = getCSSVariablesInString( cssString );
			const vars = getComputedCSSVariables(
				propertyStrings,
				ref.current
			);
			onChange( vars );
		}
	}, [ cssString, onChange ] );

	return (
		<VisuallyHidden>
			<div ref={ ref } />
		</VisuallyHidden>
	);
}
