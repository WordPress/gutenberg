/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../data-no-store-string-literals';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

const valid = [
	// Callback functions.
	`import { createRegistrySelector } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; createRegistrySelector(( select ) => { select(coreStore); });`,
	`import { useSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; useSelect(( select ) => { select(coreStore); });`,
	`import { withSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withSelect(( select ) => { select(coreStore); });`,
	`import { withDispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withDispatch(( select ) => { select(coreStore); });`,
	`import { withDispatch as withDispatchAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withDispatchAlias(( select ) => { select(coreStore); });`,

	// Direct function calls.
	`import { useDispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; useDispatch( coreStore );`,
	`import { dispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; dispatch( coreStore );`,
	`import { useSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; useSelect( coreStore );`,
	`import { select } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; select( coreStore );`,
	`import { resolveSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; resolveSelect( coreStore );`,
	`import { resolveSelect as resolveSelectAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; resolveSelectAlias( coreStore );`,

	// Object property function calls.
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.select( coreStore );`,
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.dispatch( coreStore );`,
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.resolveSelect( coreStore );`,
	`import { controls as controlsAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controlsAlias.resolveSelect( coreStore );`,
];

const createSuggestionTestCase = ( code, output ) => ( {
	code,
	errors: [
		{
			suggestions: [
				{
					desc: 'Replace literal with store definition. Import store if necessary.',
					output,
				},
			],
		},
	],
} );

const invalid = [
	// Callback functions.
	`import { createRegistrySelector } from '@wordpress/data'; createRegistrySelector(( select ) => { select( 'core' ); });`,
	`import { useSelect } from '@wordpress/data'; useSelect(( select ) => { select( 'core' ); });`,
	`import { withSelect } from '@wordpress/data'; withSelect(( select ) => { select( 'core' ); });`,
	`import { withDispatch } from '@wordpress/data'; withDispatch(( select ) => { select( 'core' ); });`,
	`import { withDispatch as withDispatchAlias } from '@wordpress/data'; withDispatchAlias(( select ) => { select( 'core' ); });`,

	// Direct function calls.
	`import { useDispatch } from '@wordpress/data'; useDispatch( 'core' );`,
	`import { dispatch } from '@wordpress/data'; dispatch( 'core' );`,
	`import { useSelect } from '@wordpress/data'; useSelect( 'core' );`,
	`import { select } from '@wordpress/data'; select( 'core' );`,
	`import { resolveSelect } from '@wordpress/data'; resolveSelect( 'core' );`,
	`import { resolveSelect as resolveSelectAlias } from '@wordpress/data'; resolveSelectAlias( 'core' );`,

	// Object property function calls.
	`import { controls } from '@wordpress/data'; controls.select( 'core' );`,
	`import { controls } from '@wordpress/data'; controls.dispatch( 'core' );`,
	`import { controls } from '@wordpress/data'; controls.resolveSelect( 'core' );`,
	`import { controls as controlsAlias } from '@wordpress/data'; controlsAlias.resolveSelect( 'core' );`,

	// Direct function calls suggestions
	// Replace core with coreStore and import coreStore.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; select( 'core' );`,
		`import { select } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; select( coreStore );`
	),
	// Replace core with coreStore. A @wordpress/core-data already exists, so it should append the import to that one.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; import { something } from '@wordpress/core-data'; select( 'core' );`,
		`import { select } from '@wordpress/data'; import { something,store as coreStore } from '@wordpress/core-data'; select( coreStore );`
	),
	// Replace core with coreStore. A @wordpress/core-data already exists, so it should append the import to that one.
	// This time there is a comma after the import.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; import { something, } from '@wordpress/core-data'; select( 'core' );`,
		`import { select } from '@wordpress/data'; import { something,store as coreStore, } from '@wordpress/core-data'; select( coreStore );`
	),
	// Replace core with coreStore. Store import already exists. It shouldn't modify the import, just replace the literal with the store definition.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; select( 'core' );`,
		`import { select } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; select( coreStore );`
	),
	// Replace core with coreStore. There are internal and WordPress dependencies.
	// It should append the import after the last WordPress dependency import.
	createSuggestionTestCase(
		`import { a } from './a'; import { select } from '@wordpress/data'; import { b } from './b'; select( 'core' );`,
		`import { a } from './a'; import { select } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; import { b } from './b'; select( coreStore );`
	),
	// Replace block-editor with blockEditorStore.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; select( 'core/block-editor' );`,
		`import { select } from '@wordpress/data';\nimport { store as blockEditorStore } from '@wordpress/block-editor'; select( blockEditorStore );`
	),
	// Replace notices with noticesStore.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; select( 'core/notices' );`,
		`import { select } from '@wordpress/data';\nimport { store as noticesStore } from '@wordpress/notices'; select( noticesStore );`
	),
];
const errors = [
	{
		message: `Do not use string literals ( 'core' ) for accessing @wordpress/data stores. Pass the store definition instead`,
	},
];

ruleTester.run( 'data-no-store-string-literals', rule, {
	valid: valid.map( ( code ) => ( { code } ) ),
	invalid: invalid.map( ( code ) =>
		typeof code === 'string' ? { code, errors } : code
	),
} );
