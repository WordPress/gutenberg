import { expect, test } from 'vitest';

test( 'imports the editor style transformer without browser-externalized warnings', async () => {
	// Import inside the test so the shared console checks include module initialization.
	const { default: transformStyles } =
		await import( '../../../packages/block-editor/src/utils/transform-styles' );

	expect(
		transformStyles(
			[
				{
					css: 'p { background: url(../image.png); }',
					baseURL: 'https://example.com/theme/css/',
				},
			],
			'.editor'
		)
	).toEqual( [
		'.editor p { background: url(https://example.com/theme/image.png); }',
	] );
} );
