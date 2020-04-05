/**
 * External dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

/** @typedef {import('puppeteer').Page} Page */

/** @typedef {import('axe-core').RunOptions} RunOptions */

/** @typedef {import('axe-core').Spec} Spec */

/**
 * Formats the list of violations object returned by Axe analysis.
 *
 * @param {Object} violations The object with the errors found by Axe.
 *
 * @return {string} The user friendly message to display when the matcher fails.
 */
function formatViolations( violations ) {
	return violations
		.map( ( { help, helpUrl, id, nodes } ) => {
			let output =
				`Rule: "${ id }" (${ help })\n` +
				`Help: ${ helpUrl }\n` +
				'Affected Nodes:\n';

			nodes.forEach( ( node ) => {
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

/**
 * Defines async matcher to check whether a given Puppeteer's page instance passes Axe accessibility tests.
 *
 * @see https://www.deque.com/axe/
 * It is possible to pass optional Axe API options to perform customized check.
 *
 * @see https://github.com/dequelabs/axe-puppeteer
 *
 * @param {Page}          page                 Puppeteer's page instance.
 * @param {?Object}       params               Optional params that allow better control over Axe API.
 * @param {?string|Array} params.include       CSS selector(s) to add to the list of elements
 *                                             to include in analysis.
 * @param {?string|Array} params.exclude       CSS selector(s) to add to the list of elements
 *                                             to exclude from analysis.
 * @param {?Array}        params.disabledRules The list of Axe rules to skip from verification.
 * @param {?RunOptions}   params.options       A flexible way to configure how Axe run operates,
 *                                             see https://github.com/dequelabs/axe-core/blob/master/doc/API.md#options-parameter.
 * @param {?Spec}         params.config        Axe configuration object,
 *                                             see https://github.com/dequelabs/axe-core/blob/master/doc/API.md#api-name-axeconfigure.
 *
 * @return {Object} A matcher object with two keys `pass` and `message`.
 */
async function toPassAxeTests(
	page,
	{ include, exclude, disabledRules, options, config } = {}
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
