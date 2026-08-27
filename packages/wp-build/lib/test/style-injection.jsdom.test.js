import { expect, test } from 'vitest';
// The test config supplies this module from wp-build's real CSS transform.
// eslint-disable-next-line import/no-unresolved
import styles from 'virtual:wp-build-style-injection';

test( 'does not inject wp-build generated styles in jsdom', () => {
	expect( styles.fixture ).toBeTruthy();
	expect( document.head ).not.toHaveTextContent(
		'--wp-build-style-injection-test'
	);
} );
