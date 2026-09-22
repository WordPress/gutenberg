import stylelint from 'stylelint';
import tokenList from '../prebuilt/js/design-tokens.mjs';
import { parseCSSVariableReferences } from '../postcss-plugins/parse-css-variables.mjs';

const DS_TOKEN_PREFIX = 'wpds-';

const knownTokens = new Set( tokenList );

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-unknown-ds-tokens';

const messages = ruleMessages( ruleName, {
	rejected: ( tokenNames ) =>
		`The following CSS variables are not valid Design System tokens: ${ tokenNames }`,
} );

/** @type {import('stylelint').Rule} */
const ruleFunction = ( primary ) => {
	return ( root, result ) => {
		const validOptions = validateOptions( result, ruleName, {
			actual: primary,
			possible: [ true ],
		} );

		if ( ! validOptions ) {
			return;
		}

		root.walkDecls( ( ruleNode ) => {
			const { value } = ruleNode;
			if ( value.includes( `--${ DS_TOKEN_PREFIX }` ) ) {
				const usedTokens = new Set(
					parseCSSVariableReferences( value )
						.references.map( ( reference ) => reference.name )
						.filter( ( name ) =>
							name.startsWith( `--${ DS_TOKEN_PREFIX }` )
						)
				);
				const unknownTokens = new Set(
					[ ...usedTokens ].filter(
						( token ) => ! knownTokens.has( token )
					)
				);

				if ( unknownTokens.size > 0 ) {
					report( {
						message: messages.rejected(
							Array.from( unknownTokens )
								.map( ( token ) => `'${ token }'` )
								.join( ', ' )
						),
						node: ruleNode,
						result,
						ruleName,
					} );
				}
			}
		} );
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

/** @type {import('stylelint').Plugin} */
export default createPlugin( ruleName, ruleFunction );
