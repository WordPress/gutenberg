import { describe, expect, it } from 'vitest';
import { getSourceOnlyMathML } from '../utils';

describe( 'getSourceOnlyMathML', () => {
	it( 'wraps the source in an annotation-only semantics element', () => {
		expect( getSourceOnlyMathML( 'x^2' ) ).toBe(
			'<semantics><annotation encoding="application/x-tex">x^2</annotation></semantics>'
		);
	} );

	it( 'escapes every ampersand and angle bracket', () => {
		expect( getSourceOnlyMathML( 'a &amp; b < c > d' ) ).toBe(
			'<semantics><annotation encoding="application/x-tex">a &amp;amp; b &lt; c &gt; d</annotation></semantics>'
		);
	} );
} );
