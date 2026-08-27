import { expect, test } from 'vitest';

test( 'injects wp-build generated styles in Browser Mode', async () => {
	const hadProcess = 'process' in globalThis;
	const originalProcess = globalThis.process;
	globalThis.process = { env: { NODE_ENV: 'test' } };

	let styles;
	try {
		// The test config supplies this module from wp-build's real CSS transform.
		( { default: styles } = await import(
			// eslint-disable-next-line import/no-unresolved
			'virtual:wp-build-style-injection'
		) );
	} finally {
		if ( hadProcess ) {
			globalThis.process = originalProcess;
		} else {
			delete globalThis.process;
		}
	}

	const fixture = document.createElement( 'div' );
	fixture.className = styles.fixture;
	document.body.append( fixture );

	expect( globalThis.getComputedStyle( fixture ).color ).toBe(
		'rgb(1, 2, 3)'
	);

	fixture.remove();
} );
