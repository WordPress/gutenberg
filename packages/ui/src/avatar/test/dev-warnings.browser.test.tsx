import { expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import warning from '@wordpress/warning';
import * as Avatar from '../index';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

it.each( [ 'currentColor', 'color-mix(in srgb, currentColor 50%, red)' ] )(
	'warns when color=%s depends on the foreground',
	async ( color ) => {
		await render( <Avatar.Root color={ color } /> );
		expect( warning ).toHaveBeenCalledWith(
			'Avatar.Root: `color` contains `currentColor`, which can produce insufficient contrast in colored fallbacks. Use a color that does not depend on the foreground.'
		);
	}
);

it( 'warns when the browser rejects the color', async () => {
	await render( <Avatar.Root color="not-a-color" /> );
	expect( warning ).toHaveBeenCalledWith(
		'Avatar.Root: The browser does not support the `color` value. Use a valid CSS color supported by this browser.'
	);
} );

it.each( [ 'inherit', 'initial', 'unset', 'revert' ] )(
	'warns when color=%s cannot fill the fallback',
	async ( color ) => {
		await render( <Avatar.Root color={ color } /> );
		expect( warning ).toHaveBeenCalledWith(
			'Avatar.Root: `color` cannot be used as a colored fallback fill. Use an explicit CSS color instead of a CSS-wide keyword such as `inherit`.'
		);
	}
);

it.each( [
	undefined,
	'#00800080',
	'transparent',
	'hsl(200 100% 50%)',
	'color(display-p3 1 0 0)',
	'var(--currentColor, red)',
	'/* currentColor */ red',
] )( 'accepts color=%s without a development warning', async ( color ) => {
	await render( <Avatar.Root color={ color } /> );
	expect( warning ).not.toHaveBeenCalled();
} );
