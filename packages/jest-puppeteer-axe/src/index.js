/**
 * External dependencies
 */
import AxePuppeteer from 'axe-puppeteer';

function formatViolations( violations ) {
	return violations.map( ( { help, id, nodes } ) => {
		let output = `Rule: ${ id } (${ help })\n` +
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
	} ).join( '\n' );
}

async function toBeAccessible( page, { include, exclude } = {} ) {
	const axe = new AxePuppeteer( page );

	if ( include ) {
		axe.include( include );
	}

	if ( exclude ) {
		axe.exclude( exclude );
	}

	const { violations } = await axe.analyze();

	const pass = violations.length === 0;
	const message = pass ?
		() => {
			return this.utils.matcherHint( '.not.toBeAccessible' ) +
				'\n\n' +
				'Expected page to contain accessibility check violations.\n' +
				'No violations found.';
		} :
		() => {
			return this.utils.matcherHint( '.toBeAccessible' ) +
				'\n\n' +
				'Expected page to be accessible.\n' +
				'Violations found:\n' +
				this.utils.RECEIVED_COLOR(
					formatViolations( violations )
				);
		};

	return {
		message,
		pass,
	};
}

expect.extend( {
	toBeAccessible,
} );
