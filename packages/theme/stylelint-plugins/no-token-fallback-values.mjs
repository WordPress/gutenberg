import stylelint from 'stylelint';
import { parseCSSVariableReferences } from '../postcss-plugins/parse-css-variables.mjs';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-token-fallback-values';

const messages = ruleMessages( ruleName, {
	rejected: ( tokenName ) =>
		`Do not add a fallback value for Design System token '${ tokenName }'. Fallbacks should be injected automatically at build time (see @wordpress/theme package README).`,
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
			const declaration = ruleNode.toString();
			const references =
				parseCSSVariableReferences( declaration ).references;
			let { line, column } = ruleNode.rangeBy( { index: 0 } ).start;
			let offset = 0;

			// SCSS serialization adds closing delimiters to line comments. Those
			// change offsets, but not line/column positions on subsequent lines.
			// References are visited in source order, so advance one shared cursor.
			/** @param {number} index Offset in the serialized declaration. */
			const getPosition = ( index ) => {
				while ( offset < index ) {
					if ( declaration[ offset++ ] === '\n' ) {
						line++;
						column = 1;
					} else {
						column++;
					}
				}
				return { line, column };
			};

			for ( const reference of references ) {
				if (
					! reference.name.startsWith( '--wpds-' ) ||
					! reference.fallbackSeparator
				) {
					continue;
				}

				report( {
					message: messages.rejected( reference.name ),
					node: ruleNode,
					start: getPosition( reference.sourceIndex ),
					end: getPosition(
						reference.fallbackSeparator.sourceEndIndex -
							reference.fallbackSeparator.after.length
					),
					result,
					ruleName,
				} );
			}
		} );
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

/** @type {import('stylelint').Plugin} */
export default createPlugin( ruleName, ruleFunction );
