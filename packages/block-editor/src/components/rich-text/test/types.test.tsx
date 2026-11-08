import { useState } from '@wordpress/element';
import type { RichTextData } from '@wordpress/rich-text';
import { describe, expect, it } from 'vitest';

/*
 * These checks run at type-check time: each `@ts-expect-error` fails the
 * type check if the line below it stops being a type error.
 */
declare const RichText: typeof import( '..' ).default;
declare const data: RichTextData;

// Never called, so the public component only needs its type here.
function RichTextCallbacks() {
	const [ content, setContent ] = useState( '' );
	return (
		<>
			<RichText tagName="p" value={ content } onChange={ setContent } />
			<RichText
				value={ data }
				onChange={ ( next ) => next.toHTMLString() }
			/>
			<RichText
				value={ data }
				__unstableDisableFormats
				onChange={ ( next ) => next.toUpperCase() }
			/>
			{ /* @ts-expect-error Formats disabled, the field passes plain text. */ }
			<RichText
				value={ data }
				__unstableDisableFormats
				onChange={ ( next: RichTextData ) => next.toHTMLString() }
			/>
			<RichText
				value={ content }
				__unstableDisableFormats
				onChange={ setContent }
			/>
		</>
	);
}

describe( 'RichText types', () => {
	it( 'ties the change handler to the value and the formats mode', () => {
		expect( RichTextCallbacks ).toBeInstanceOf( Function );
	} );
} );
