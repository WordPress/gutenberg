/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

/**
 * External dependencies
 */
// eslint-disable-next-line import/no-unresolved
import nameStatic from 'test/router-script-modules-alpha-1';
// eslint-disable-next-line import/no-unresolved
import nameInitialStatic from 'test/router-script-modules-initial-1';

const { state } = store( 'test/router-script-modules-alpha', {
	state: {
		name: 'alpha',
	},
	actions: {
		updateFromStatic() {
			state.name = nameStatic;
		},
		updateFromInitialStatic() {
			state.name = nameInitialStatic;
		},
		*updateFromDynamic() {
			const { default: nameDynamic } = yield import(
				// eslint-disable-next-line import/no-unresolved
				'test/router-script-modules-alpha-2'
			);
			state.name = nameDynamic;
		},
		*updateFromInitialDynamic() {
			const { default: nameInitialDynamic } = yield import(
				// eslint-disable-next-line import/no-unresolved
				'test/router-script-modules-initial-2'
			);
			state.name = nameInitialDynamic;
		},
	},
} );

const { actions } = store( 'test/router-script-modules' );
actions.pushName?.( state.name );
