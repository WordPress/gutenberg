import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import recommendationRule from '../../../packages/eslint-plugin/rules/use-recommended-components.js';
import rule from '../rules/no-broad-component-suppression.mjs';

const RULE_ID = 'gutenberg/no-broad-component-suppression';
const RECOMMENDATION_RULE = '@wordpress/use-recommended-components';

describe( 'no-broad-component-suppression', () => {
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
				{
					linterOptions: { reportUnusedDisableDirectives: 'off' },
					plugins: {
						gutenberg: {
							rules: { 'no-broad-component-suppression': rule },
						},
						'@wordpress': {
							rules: {
								'use-recommended-components':
									recommendationRule,
							},
						},
					},
					rules: {
						[ RULE_ID ]: 'error',
						[ RECOMMENDATION_RULE ]: 'error',
					},
				}
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
