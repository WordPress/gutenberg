/**
 * External dependencies
 */
import AxePuppeteer from '@axe-core/puppeteer';
import type { Page } from 'puppeteer-core';
import type { RunOptions, Spec, Result, NodeResult } from 'axe-core';

/**
 * Formats the list of violations object returned by Axe analysis.
 *
 * @param {Array<Result>} violations The array with the errors found by Axe.
 *
 * @return {string} The user friendly message to display when the matcher fails.
 */
function formatViolations( violations: Array< Result > ): string {
	return violations
		.map( ( { help, helpUrl, id, nodes } ) => {
			let output =
				`Rule: "${ id }" (${ help })\n` +
				`Help: ${ helpUrl }\n` +
				'Affected Nodes:\n';

			nodes.forEach( ( node: NodeResult ) => {
				if ( node.any.length ) {
					output += `  ${ node.target }\n`;
					output += '    Fix ANY of the following:\n';
					node.any.forEach( ( item ) => {
						output += `    - ${ item.message }\n`;
					} );
				}

				if ( node.all.length ) {
					output += `  ${ node.target }\n`;
					output += '    Fix ALL of the following:\n';
					node.all.forEach( ( item ) => {
						output += `      - ${ item.message }.\n`;
					} );
				}

				if ( node.none.length ) {
					output += `  ${ node.target }\n`;
					output += '    Fix ALL of the following:\n';
					node.none.forEach( ( item ) => {
						output += `      - ${ item.message }.\n`;
					} );
				}
			} );
			return output;
		} )
		.join( '\n' );
}

interface AxeTestParams {
	/**
	 * CSS selector(s) to include in analysis.
	 */
	include?: string | string[];
	/**
	 * CSS selector(s) to exclude from analysis.
	 */
	exclude?: string | string[];
	/**
	 * List of Axe rules to skip from verification.
	 */
	disabledRules?: string[];
	/**
	 * Options to configure how Axe run operates.
	 * @see https://github.com/dequelabs/axe-core/blob/HEAD/doc/API.md#options-parameter
	 */
	options?: RunOptions;
	/**
	 * Axe configuration object.
	 * @see https://github.com/dequelabs/axe-core/blob/HEAD/doc/API.md#api-name-axeconfigure
	 */
	config?: Spec;
}

/**
 * Defines async matcher to check whether a given Puppeteer's page instance passes Axe accessibility tests.
 *
 * @see https://www.deque.com/axe/
 * It is possible to pass optional Axe API options to perform customized check.
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/puppeteer
 *
 * @param {import('@jest/expect').MatcherContext} this   Matcher context from Jest.
 * @param {Page}                                  page   Puppeteer's page instance.
 * @param {AxeTestParams}                         params Optional params that allow better control over Axe API.
 * @return A matcher object with two keys `pass` and `message`.
 */
async function toPassAxeTests(
	this: jest.MatcherContext,
	page: Page,
	{ include, exclude, disabledRules, options, config }: AxeTestParams = {}
) {
	const axe = new AxePuppeteer( page );

	if ( include ) {
		axe.include( include );
	}

	if ( exclude ) {
		axe.exclude( exclude );
	}

	if ( options ) {
		axe.options( options );
	}

	if ( disabledRules ) {
		axe.disableRules( disabledRules );
	}

	if ( config ) {
		axe.configure( config );
	}

	const { violations } = await axe.analyze();

	const pass = violations.length === 0;
	const message = pass
		? () => {
				return (
					this.utils.matcherHint( '.not.toPassAxeTests' ) +
					'\n\n' +
					'Expected page to contain accessibility check violations.\n' +
					'No violations found.'
				);
		  }
		: () => {
				return (
					this.utils.matcherHint( '.toPassAxeTests' ) +
					'\n\n' +
					'Expected page to pass Axe accessibility tests.\n' +
					'Violations found:\n' +
					this.utils.RECEIVED_COLOR( formatViolations( violations ) )
				);
		  };

	return {
		message,
		pass,
	};
}

expect.extend( {
	toPassAxeTests,
} );
