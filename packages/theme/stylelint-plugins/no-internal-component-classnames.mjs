import stylelint from 'stylelint';
import selectorParser from 'postcss-selector-parser';

const INTERNAL_CLASS_PREFIX = 'component-';

const {
	createPlugin,
	utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'plugin-wpds/no-internal-component-classnames';

const messages = ruleMessages( ruleName, {
	rejected: ( className ) =>
		`Avoid overriding internal "${ className }" class names from @wordpress/components. These selectors are not a stable API and component style overrides are not advised. Target the component with a custom CSS selector instead.`,
} );

/**
 * @param {string} selector
 * @return {Set<string>}
 */
function getInternalClassNames( selector ) {
	/** @type {Set<string>} */
	const classNames = new Set();

	const processSelector = selectorParser( ( selectors ) => {
		selectors.walkClasses( ( classNode ) => {
			if ( classNode.value.startsWith( INTERNAL_CLASS_PREFIX ) ) {
				classNames.add( classNode.value );
			}
		} );
	} );

	try {
		processSelector.processSync( selector );
	} catch {
		// Ignore selectors that cannot be parsed (for example, SCSS placeholders).
	}

	return classNames;
}

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

		root.walkRules( ( ruleNode ) => {
			const internalClassNames = getInternalClassNames(
				ruleNode.selector
			);

			for ( const className of internalClassNames ) {
				report( {
					message: messages.rejected( className ),
					node: ruleNode,
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
