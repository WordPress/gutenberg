import { expect, test } from 'vitest';
// The test config supplies this module from wp-build's real CSS transform.
// eslint-disable-next-line import/no-unresolved
import styles from 'virtual:wp-build-style-injection';

test( 'injects wp-build generated styles in Browser Mode', () => {
	const fixture = document.createElement( 'div' );
	fixture.className = styles.fixture;
	document.body.append( fixture );

	expect( globalThis.getComputedStyle( fixture ).color ).toBe(
		'rgb(1, 2, 3)'
	);

	fixture.remove();
} );
