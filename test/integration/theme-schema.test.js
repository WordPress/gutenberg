import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import glob from 'fast-glob';
import { beforeEach, describe, expect, it, test } from 'vitest';
import themeSchema from '../../schemas/json/theme.json';

describe( 'theme.json schema', () => {
	const jsonFiles = glob.sync(
		[ 'packages/*/src/**/theme.json', '{lib,phpunit,test}/**/theme.json' ],
		{ onlyFiles: true, ignore: [ '**/node_modules/**' ] }
	);
	const invalidFiles = glob.sync(
		[ 'test/integration/fixtures/schemas/*.json' ],
		{ onlyFiles: true }
	);
	let ajv;

	beforeEach( () => {
		ajv = new Ajv( {
			// Used for matching unknown blocks without repeating core blocks names
			// with patternProperties in settings.blocks and settings.styles
			allowMatchingProperties: true,
		} );
	} );

	it( 'strictly adheres to the draft-07 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas, compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( themeSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'found theme.json files', () => {
		expect( jsonFiles.length ).toBeGreaterThan( 0 );
	} );

	test( 'accepts supported text input pseudo-selectors', () => {
		const theme = {
			version: 3,
			styles: {
				elements: {
					textInput: {
						':focus': {
							color: { text: 'blue' },
						},
						':user-invalid': {
							spacing: { padding: { top: '1rem' } },
						},
						'::placeholder': {
							typography: { fontStyle: 'italic' },
						},
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test( 'rejects unsupported text input pseudo-selectors', () => {
		const theme = {
			version: 3,
			styles: {
				elements: {
					textInput: {
						':hover': {
							color: { text: 'green' },
						},
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test( 'accepts separate row and column block gaps in block styles', () => {
		const theme = {
			version: 3,
			styles: {
				blocks: {
					'core/group': {
						spacing: { blockGap: { top: '1.3em', left: '0.75em' } },
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test( 'rejects separate row and column block gaps in root styles', () => {
		const theme = {
			version: 3,
			styles: {
				spacing: { blockGap: { top: '1.3em', left: '0.75em' } },
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test( 'rejects separate row and column block gaps in element styles', () => {
		const theme = {
			version: 3,
			styles: {
				elements: {
					button: {
						spacing: { blockGap: { top: '1.3em', left: '0.75em' } },
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test( 'accepts a rotation in block styles and block style variations', () => {
		const theme = {
			version: 3,
			styles: {
				blocks: {
					'core/image': {
						transform: { rotate: '0.25turn' },
						variations: {
							rounded: { transform: { rotate: '-5deg' } },
						},
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test.each( [
		[ 'root', { transform: { rotate: '5deg' } } ],
		[
			'element',
			{ elements: { link: { transform: { rotate: '5deg' } } } },
		],
		[
			'element state',
			{
				elements: {
					link: { ':hover': { transform: { rotate: '5deg' } } },
				},
			},
		],
		[
			'select state',
			{
				elements: {
					select: { ':hover': { transform: { rotate: '5deg' } } },
				},
			},
		],
		[
			'text input state',
			{
				elements: {
					textInput: {
						':focus': { transform: { rotate: '5deg' } },
					},
				},
			},
		],
		[
			'text input placeholder',
			{
				elements: {
					textInput: {
						'::placeholder': { transform: { rotate: '5deg' } },
					},
				},
			},
		],
	] )( 'rejects a rotation in %s styles', ( _, styles ) => {
		expect( ajv.validate( themeSchema, { version: 3, styles } ) ).toBe(
			false
		);
	} );

	test( 'accepts an offset with one or both axes in block styles and states', () => {
		const theme = {
			version: 3,
			styles: {
				blocks: {
					'core/image': {
						transform: { translate: { x: '10px', y: '-50%' } },
						variations: {
							raised: { transform: { translate: { x: '1rem' } } },
						},
					},
					'core/button': {
						':hover': { transform: { translate: { y: '-4px' } } },
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test.each( [
		[ 'a string', '10px 20px' ],
		[ 'a z axis', { x: '10px', z: '5px' } ],
	] )( 'rejects an offset given as %s', ( _, translate ) => {
		const theme = {
			version: 3,
			styles: {
				blocks: { 'core/image': { transform: { translate } } },
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test( 'rejects an offset in element styles', () => {
		const styles = {
			elements: { link: { transform: { translate: { x: '1px' } } } },
		};

		expect( ajv.validate( themeSchema, { version: 3, styles } ) ).toBe(
			false
		);
	} );

	test( 'accepts a scale as a number or percentage in block styles and states', () => {
		const theme = {
			version: 3,
			styles: {
				blocks: {
					'core/image': {
						transform: { scale: 1.2 },
						variations: {
							large: { transform: { scale: '150%' } },
						},
					},
					'core/heading': {
						'@mobile': { transform: { scale: '0.8' } },
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test.each( [
		[ 'a negative number', -1 ],
		[ 'a negative string', '-1' ],
		[ 'two values', '1.2 1.5' ],
		[ 'a calc() value', 'calc(1 + 0.2)' ],
		[ 'a var() value', 'var(--scale)' ],
		[ 'an object', { x: 1.2 } ],
	] )( 'rejects a scale given as %s', ( _, scale ) => {
		const theme = {
			version: 3,
			styles: {
				blocks: { 'core/image': { transform: { scale } } },
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test.each( [
		[ 'element', { elements: { link: { transform: { scale: 1.2 } } } } ],
		[
			'element state',
			{ elements: { link: { ':hover': { transform: { scale: 1.2 } } } } },
		],
		[
			'select element state',
			{
				elements: {
					select: { ':hover': { transform: { scale: 1.2 } } },
				},
			},
		],
		[
			'text input element state',
			{
				elements: {
					textInput: { ':focus': { transform: { scale: 1.2 } } },
				},
			},
		],
	] )( 'rejects a scale in %s styles', ( _, styles ) => {
		expect( ajv.validate( themeSchema, { version: 3, styles } ) ).toBe(
			false
		);
	} );

	test.each( jsonFiles )( 'validates schema for `%s`', ( filepath ) => {
		// We want to validate the theme.json file using the local schema.
		const { $schema, ...metadata } = JSON.parse(
			readFileSync( filepath, 'utf8' )
		);

		// we expect the $schema property to be present in the theme.json file
		expect( $schema ).toBeTruthy();

		const result = ajv.validate( themeSchema, metadata ) || ajv.errors;

		expect( result ).toBe( true );
	} );

	test( 'accepts supported select pseudo-selectors', () => {
		const theme = {
			version: 3,
			styles: {
				elements: {
					select: {
						':hover': {
							color: { background: 'blue' },
						},
						':focus-visible': {
							outline: { style: 'solid' },
						},
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( true );
	} );

	test( 'rejects unsupported select pseudo-selectors', () => {
		const theme = {
			version: 3,
			styles: {
				elements: {
					select: {
						':visited': {
							color: { text: 'green' },
						},
					},
				},
			},
		};

		expect( ajv.validate( themeSchema, theme ) ).toBe( false );
	} );

	test.each( invalidFiles )( 'invalidates schema for `%s`', ( filepath ) => {
		// We want to validate the theme.json file using the local schema.
		const { $schema, ...metadata } = JSON.parse(
			readFileSync( filepath, 'utf8' )
		);

		const result = ajv.validate( themeSchema, metadata );

		expect( result ).toBe( false );
	} );
} );
