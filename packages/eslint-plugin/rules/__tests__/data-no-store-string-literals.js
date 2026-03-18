/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../data-no-store-string-literals';

const ruleTester = new RuleTester( {
	languageOptions: {
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

const createErrorWithSuggestions = ( storeName, output ) => [
	{
		messageId: 'doNotUseStringLiteral',
		data: { argument: storeName },
		suggestions: [
			{
				desc: 'Replace literal with store definition. Import store if necessary.',
				output,
			},
		],
	},
];

const createSuggestionTestCase = ( code, output, storeName = 'core' ) => ( {
	code,
	errors: createErrorWithSuggestions( storeName, output ),
} );

const invalid = [
	// Callback functions.
	createSuggestionTestCase(
		`import { createRegistrySelector } from '@wordpress/data'; createRegistrySelector(( select ) => { select( 'core' ); });`,
		`import { createRegistrySelector } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; createRegistrySelector(( select ) => { select( coreStore ); });`
	),
	createSuggestionTestCase(
		`import { useSelect } from '@wordpress/data'; useSelect(( select ) => { select( 'core' ); });`,
		`import { useSelect } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; useSelect(( select ) => { select( coreStore ); });`
	),
	createSuggestionTestCase(
		`import { withSelect } from '@wordpress/data'; withSelect(( select ) => { select( 'core' ); });`,
		`import { withSelect } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; withSelect(( select ) => { select( coreStore ); });`
	),
	createSuggestionTestCase(
		`import { withDispatch } from '@wordpress/data'; withDispatch(( select ) => { select( 'core' ); });`,
		`import { withDispatch } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; withDispatch(( select ) => { select( coreStore ); });`
	),
	createSuggestionTestCase(
		`import { withDispatch as withDispatchAlias } from '@wordpress/data'; withDispatchAlias(( select ) => { select( 'core' ); });`,
		`import { withDispatch as withDispatchAlias } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; withDispatchAlias(( select ) => { select( coreStore ); });`
	),

	// Direct function calls.
	createSuggestionTestCase(
		`import { useDispatch } from '@wordpress/data'; useDispatch( 'core' );`,
		`import { useDispatch } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; useDispatch( coreStore );`
	),
	createSuggestionTestCase(
		`import { dispatch } from '@wordpress/data'; dispatch( 'core' );`,
		`import { dispatch } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; dispatch( coreStore );`
	),
	createSuggestionTestCase(
		`import { useSelect } from '@wordpress/data'; useSelect( 'core' );`,
		`import { useSelect } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; useSelect( coreStore );`
	),
	createSuggestionTestCase(
		`import { resolveSelect } from '@wordpress/data'; resolveSelect( 'core' );`,
		`import { resolveSelect } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; resolveSelect( coreStore );`
	),
	createSuggestionTestCase(
		`import { resolveSelect as resolveSelectAlias } from '@wordpress/data'; resolveSelectAlias( 'core' );`,
		`import { resolveSelect as resolveSelectAlias } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; resolveSelectAlias( coreStore );`
	),

	// Object property function calls.
	createSuggestionTestCase(
		`import { controls } from '@wordpress/data'; controls.select( 'core' );`,
		`import { controls } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; controls.select( coreStore );`
	),
	createSuggestionTestCase(
		`import { controls } from '@wordpress/data'; controls.dispatch( 'core' );`,
		`import { controls } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; controls.dispatch( coreStore );`
	),
	createSuggestionTestCase(
		`import { controls } from '@wordpress/data'; controls.resolveSelect( 'core' );`,
		`import { controls } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; controls.resolveSelect( coreStore );`
	),
	createSuggestionTestCase(
		`import { controls as controlsAlias } from '@wordpress/data'; controlsAlias.resolveSelect( 'core' );`,
		`import { controls as controlsAlias } from '@wordpress/data';\nimport { store as coreStore } from '@wordpress/core-data'; controlsAlias.resolveSelect( coreStore );`
	),

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
		`import { select } from '@wordpress/data';\nimport { store as blockEditorStore } from '@wordpress/block-editor'; select( blockEditorStore );`,
		'core/block-editor'
	),
	// Replace notices with noticesStore.
	createSuggestionTestCase(
		`import { select } from '@wordpress/data'; select( 'core/notices' );`,
		`import { select } from '@wordpress/data';\nimport { store as noticesStore } from '@wordpress/notices'; select( noticesStore );`,
		'core/notices'
	),
];

ruleTester.run( 'data-no-store-string-literals', rule, {
	valid: valid.map( ( code ) => ( { code } ) ),
	invalid,
} );
