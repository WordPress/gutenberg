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

function getCSSVariables( cssString: string, element: HTMLDivElement ) {
	const matches = cssString.match( /var\(--[\w-]+\)/g ) ?? [];

	return matches.reduce( ( acc, cssVar ) => {
		const propertyString = cssVar.match( /\(([^)]+)\)/ )?.[ 1 ] as string;
		const value = window
			.getComputedStyle( element )
			.getPropertyValue( propertyString );
		acc[ propertyString ] = value;
		return acc;
	}, {} as CSSVariables );
}

function CSSVariableGetter( { cssString, onChange }: CSSVariableGetterProps ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		if ( cssString && ref.current ) {
			const vars = getCSSVariables( cssString, ref.current );
			onChange( vars );
		}
	}, [ cssString, onChange ] );

	return (
		<VisuallyHidden>
			<div ref={ ref } />
		</VisuallyHidden>
	);
}

export default CSSVariableGetter;
