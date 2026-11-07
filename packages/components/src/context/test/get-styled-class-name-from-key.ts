import { describe, expect, it } from 'vitest';
import { getStyledClassNameFromKey } from '../get-styled-class-name-from-key';
import { contextConnectWithoutRef } from '../context-connect';

describe( 'component class names', () => {
	it.each( [
		[ 'HTMLInputElement', 'components-html-input-element' ],
		[ 'InputControl2D', 'components-input-control2-d' ],
		[ 'Foo99bar', 'components-foo99bar' ],
		[ 'Navigator.BackButton', 'components-navigator-back-button' ],
		[ '__Foo--Bar__', 'components-foo-bar' ],
		[ '', 'components-' ],
	] )( 'preserves the class name for %s', ( namespace, className ) => {
		expect( getStyledClassNameFromKey( namespace ) ).toBe( className );
	} );

	it( 'preserves the static selector on connected components', () => {
		const Component = contextConnectWithoutRef(
			() => null,
			'Navigator.BackButton'
		);

		expect( Component.selector ).toBe(
			'.components-navigator-back-button'
		);
	} );
} );
