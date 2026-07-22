/**
 * External dependencies
 */
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import {
	WIDGET_I18N_CONTEXTS,
	collectWidgetTranslatableStrings,
} from '../widget-utils.mjs';

const WIDGET_I18N_SCHEMA_PATH = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'..',
	'lib',
	'experimental',
	'dashboard-widgets',
	'widget-i18n.json'
);

describe( 'WIDGET_I18N_CONTEXTS stays in sync with widget-i18n.json', () => {
	const schema = JSON.parse(
		readFileSync( WIDGET_I18N_SCHEMA_PATH, 'utf8' )
	);

	it( 'matches every context the runtime translation uses', () => {
		expect( WIDGET_I18N_CONTEXTS.title ).toBe( schema.title );
		expect( WIDGET_I18N_CONTEXTS.description ).toBe( schema.description );
		expect( WIDGET_I18N_CONTEXTS.helpContent ).toBe( schema.help.content );
		expect( WIDGET_I18N_CONTEXTS.helpLinkLabel ).toBe(
			schema.help.links[ 0 ].label
		);
		expect( WIDGET_I18N_CONTEXTS.actionLabel ).toBe(
			schema.actions[ 0 ].label
		);
		expect( WIDGET_I18N_CONTEXTS.keyword ).toBe( schema.keywords[ 0 ] );
	} );

	it( 'covers every translatable field the schema declares', () => {
		// A new schema field must gain an emitted context, or its strings
		// ship unextractable.
		const schemaContexts = [
			schema.title,
			schema.description,
			schema.help.content,
			...schema.help.links.map( ( link ) => link.label ),
			...schema.actions.map( ( action ) => action.label ),
			...schema.keywords,
		].sort();

		expect( Object.values( WIDGET_I18N_CONTEXTS ).sort() ).toEqual(
			schemaContexts
		);
	} );
} );

describe( 'collectWidgetTranslatableStrings()', () => {
	it( 'collects every declared value with its context', () => {
		const entries = collectWidgetTranslatableStrings( {
			title: 'My widget',
			description: 'What it does.',
			help: {
				content: 'Some help.',
				links: [ { label: 'Learn more', href: 'https://example.com' } ],
			},
			actions: [ { id: 'view', label: 'View', href: '/view' } ],
			keywords: [ 'alpha', 'beta' ],
		} );

		expect( entries ).toEqual( [
			{ value: 'My widget', context: 'widget title' },
			{ value: 'What it does.', context: 'widget description' },
			{ value: 'Some help.', context: 'widget help content' },
			{ value: 'Learn more', context: 'widget help link label' },
			{ value: 'View', context: 'widget action label' },
			{ value: 'alpha', context: 'widget keyword' },
			{ value: 'beta', context: 'widget keyword' },
		] );
	} );

	it( 'skips missing and empty values', () => {
		expect(
			collectWidgetTranslatableStrings( {
				title: '',
				description: null,
				help: { content: 'Help only.' },
			} )
		).toEqual( [
			{ value: 'Help only.', context: 'widget help content' },
		] );
	} );
} );
