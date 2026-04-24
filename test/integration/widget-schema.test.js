/**
 * External dependencies
 */
import Ajv from 'ajv';

/**
 * Internal dependencies
 */
import widgetSchema from '../../schemas/json/widget.json';

describe( 'widget.json schema', () => {
	const ajv = new Ajv();

	test( 'strictly adheres to the draft-07 meta schema', () => {
		// Use ajv.compile instead of ajv.validateSchema to validate the schema
		// because validateSchema only checks syntax, whereas compile checks
		// if the schema is semantically correct with strict mode.
		// See https://github.com/ajv-validator/ajv/issues/1434#issuecomment-822982571
		const result = ajv.compile( widgetSchema );

		expect( result.errors ).toBe( null );
	} );

	test( 'accepts a minimal valid widget.json', () => {
		const minimal = {
			apiVersion: 1,
			name: 'core/on-this-day',
			title: 'On this day',
		};

		const result = ajv.validate( widgetSchema, minimal ) || ajv.errors;

		expect( result ).toBe( true );
	} );

	test( 'accepts a fully populated widget.json', () => {
		const full = {
			apiVersion: 1,
			name: 'my-plugin/on-this-day',
			title: 'On this day',
			description:
				'Surface posts published on this day in previous years.',
			icon: 'calendar',
			category: 'dashboard',
			textdomain: 'my-plugin',
			version: '1.0.0',
			keywords: [ 'history', 'archive' ],
			attributes: [
				{
					name: 'count',
					type: 'number',
					label: 'Number of posts',
					description: 'How many posts to show.',
					default: 3,
					min: 1,
					max: 10,
					step: 1,
				},
				{
					name: 'order',
					type: 'select',
					label: 'Order',
					options: [
						{ label: 'Newest first', value: 'desc' },
						{ label: 'Oldest first', value: 'asc' },
					],
					default: 'desc',
				},
				{
					name: 'showDate',
					type: 'boolean',
					label: 'Show date',
					default: false,
				},
			],
			styles: [
				{ name: 'default', label: 'Default', isDefault: true },
				{ name: 'compact', label: 'Compact' },
			],
			example: {
				attributes: { count: 5 },
			},
		};

		const result = ajv.validate( widgetSchema, full ) || ajv.errors;

		expect( result ).toBe( true );
	} );

	test( 'rejects a widget.json missing required fields', () => {
		const missing = {
			title: 'Missing name and apiVersion',
		};

		const result = ajv.validate( widgetSchema, missing );

		expect( result ).toBe( false );
	} );

	test( 'rejects an invalid name format', () => {
		const badName = {
			apiVersion: 1,
			name: 'no-namespace',
			title: 'Bad name',
		};

		const result = ajv.validate( widgetSchema, badName );

		expect( result ).toBe( false );
	} );

	test( 'rejects an attribute missing required field properties', () => {
		const missingFieldProps = {
			apiVersion: 1,
			name: 'my-plugin/test',
			title: 'Test',
			attributes: [
				{
					name: 'count',
					// missing required 'type' and 'label'
				},
			],
		};

		const result = ajv.validate( widgetSchema, missingFieldProps );

		expect( result ).toBe( false );
	} );

	test( 'rejects unknown top-level properties', () => {
		const extraProps = {
			apiVersion: 1,
			name: 'my-plugin/test',
			title: 'Test',
			save: 'save.js', // block.json concept — not valid in widget.json
		};

		const result = ajv.validate( widgetSchema, extraProps );

		expect( result ).toBe( false );
	} );
} );
