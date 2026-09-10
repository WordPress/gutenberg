import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { addFallbackToVar } from '../../../../postcss-plugins/ds-token-fallbacks.mjs';
import { DEFAULT_SEED_COLORS } from '../constants';

describe( 'DEFAULT_SEED_COLORS', () => {
	it( 'is reflected in design-tokens.css artifact', async () => {
		const css = await readFile(
			join(
				import.meta.dirname,
				'../../../../prebuilt/css/design-tokens.css'
			),
			'utf8'
		);

		Object.entries( {
			'--wpds-color-background-surface-neutral':
				DEFAULT_SEED_COLORS.background,
			'--wpds-color-background-interactive-brand-strong':
				DEFAULT_SEED_COLORS.primary,
			'--wpds-color-background-interactive-error-strong':
				DEFAULT_SEED_COLORS.error,
		} ).forEach( ( [ name, value ] ) => {
			expect( css ).toContain( `${ name }: ${ value };` );
		} );
	} );

	it( 'is reflected in design-token-fallbacks.mjs artifact', () => {
		expect(
			addFallbackToVar( 'var(--wpds-color-background-surface-neutral)' )
		).toBe(
			`var(--wpds-color-background-surface-neutral, ${ DEFAULT_SEED_COLORS.background })`
		);
		expect(
			addFallbackToVar(
				'var(--wpds-color-background-interactive-brand-strong)'
			)
		).toBe(
			`var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, ${ DEFAULT_SEED_COLORS.primary }))`
		);
		expect(
			addFallbackToVar(
				'var(--wpds-color-background-interactive-error-strong)'
			)
		).toBe(
			`var(--wpds-color-background-interactive-error-strong, ${ DEFAULT_SEED_COLORS.error })`
		);
	} );
} );
