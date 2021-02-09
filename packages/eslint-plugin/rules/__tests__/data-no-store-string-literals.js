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
	// Callback functions
	`import { createRegistrySelector } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; createRegistrySelector(( select ) => { select(store); });`,
	`import { useSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; useSelect(( select ) => { select(store); });`,
	`import { withSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withSelect(( select ) => { select(store); });`,
	`import { withDispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withDispatch(( select ) => { select(store); });`,
	`import { withDispatch as withDispatchAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; withDispatchAlias(( select ) => { select(store); });`,

	// Direct function calls
	`import { useDispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; useDispatch( store );`,
	`import { dispatch } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; dispatch( store );`,
	`import { select } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; select( store );`,
	`import { resolveSelect } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; resolveSelect( store );`,
	`import { resolveSelect as resolveSelectAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; resolveSelectAlias( store );`,

	// Object property function calls
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.select( store );`,
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.dispatch( store );`,
	`import { controls } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controls.resolveSelect( store );`,
	`import { controls as controlsAlias } from '@wordpress/data'; import { store as coreStore } from '@wordpress/core-data'; controlsAlias.resolveSelect( store );`,
];

const invalid = [
	// Callback functions
	`import { createRegistrySelector } from '@wordpress/data'; createRegistrySelector(( select ) => { select( 'core' ); });`,
	`import { useSelect } from '@wordpress/data'; useSelect(( select ) => { select( 'core' ); });`,
	`import { withSelect } from '@wordpress/data'; withSelect(( select ) => { select( 'core' ); });`,
	`import { withDispatch } from '@wordpress/data'; withDispatch(( select ) => { select( 'core' ); });`,
	`import { withDispatch as withDispatchAlias } from '@wordpress/data'; withDispatchAlias(( select ) => { select( 'core' ); });`,

	// Direct function calls
	`import { useDispatch } from '@wordpress/data'; useDispatch( 'core' );`,
	`import { dispatch } from '@wordpress/data'; dispatch( 'core' );`,
	`import { select } from '@wordpress/data'; select( 'core' );`,
	`import { resolveSelect } from '@wordpress/data'; resolveSelect( 'core' );`,
	`import { resolveSelect as resolveSelectAlias } from '@wordpress/data'; resolveSelectAlias( 'core' );`,

	// Object property function calls
	`import { controls } from '@wordpress/data'; controls.select( 'core' );`,
	`import { controls } from '@wordpress/data'; controls.dispatch( 'core' );`,
	`import { controls } from '@wordpress/data'; controls.resolveSelect( 'core' );`,
	`import { controls as controlsAlias } from '@wordpress/data'; controlsAlias.resolveSelect( 'core' );`,
];
const errors = [
	{
		message: `Do not use string literals ( 'core' ) for accessing @wordpress/data stores. Pass the store definition instead`,
	},
];

ruleTester.run( 'data-no-store-string-literals', rule, {
	valid: valid.map( ( code ) => ( { code } ) ),
	invalid: invalid.map( ( code ) => ( { code, errors } ) ),
} );
