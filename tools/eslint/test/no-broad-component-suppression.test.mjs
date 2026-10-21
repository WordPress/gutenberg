import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import recommendationRule from '../../../packages/eslint-plugin/rules/use-recommended-components.js';
import rule from '../rules/no-broad-component-suppression.mjs';

const RULE_ID = 'gutenberg/no-broad-component-suppression';
const RECOMMENDATION_RULE = '@wordpress/use-recommended-components';

const config = {
	linterOptions: { reportUnusedDisableDirectives: 'off' },
	plugins: {
		gutenberg: {
			rules: { 'no-broad-component-suppression': rule },
		},
		'@wordpress': {
			rules: { 'use-recommended-components': recommendationRule },
		},
	},
	rules: {
		[ RULE_ID ]: 'error',
		[ RECOMMENDATION_RULE ]: 'error',
	},
};

describe( 'no-broad-component-suppression', () => {
	it( 'accepts an exception above one import specifier', () => {
		const messages = new Linter().verify(
			`import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
	Stack,
} from '@wordpress/ui';`,
			config
		);

		expect( messages ).toEqual( [] );
	} );

	it( 'still reports another unrecommended component on a separate line', () => {
		const messages = new Linter().verify(
			`import {
	// eslint-disable-next-line @wordpress/use-recommended-components
	Menu,
	Dialog,
	Stack,
} from '@wordpress/ui';`,
			config
		);

		expect( messages ).toEqual( [
			expect.objectContaining( {
				ruleId: RECOMMENDATION_RULE,
				line: 4,
				message: expect.stringContaining( '`Dialog`' ),
			} ),
		] );
	} );

	it.each( [
		'// eslint-disable-next-line "@wordpress/use-recommended-components"',
		"// eslint-disable-next-line '@wordpress/use-recommended-components'",
		'// eslint-disable-next-line no-unused-vars, "@wordpress/use-recommended-components" -- Intentional use.',
		'/* eslint-disable "@wordpress/use-recommended-components" */',
		"/* eslint-disable '@wordpress/use-recommended-components' */",
		'/* eslint-disable no-unused-vars, "@wordpress/use-recommended-components" -- Intentional use. */',
	] )(
		'reports broad suppressions with quoted rule IDs: %s',
		( directive ) => {
			const linter = new Linter();
			const messages = linter.verify(
				`${ directive }\nimport { UnrecommendedComponent, AnotherUnrecommendedComponent } from '@wordpress/ui';`,
				config
			);

			expect( messages ).toEqual( [
				expect.objectContaining( {
					ruleId: RULE_ID,
					messageId: 'narrowSuppression',
					line: 1,
				} ),
			] );
			expect(
				linter
					.getSuppressedMessages()
					.map( ( message ) => message.ruleId )
			).toEqual( [ RECOMMENDATION_RULE, RECOMMENDATION_RULE ] );
		}
	);
} );
