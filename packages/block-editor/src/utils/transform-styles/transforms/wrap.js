/**
 * @constant string IS_ROOT_TAG Regex to check if the selector is a root tag selector.
 */
const IS_ROOT_TAG = /^(body|html|:root).*$/;

/**
 * Creates a callback to modify selectors so they only apply within a certain
 * namespace.
 *
 * @param {string}   namespace Namespace to prefix selectors with.
 * @param {string[]} ignore    Selectors to not prefix.
 *
 * @return {(node: Object) => Object} Callback to wrap selectors.
 */
const wrap = ( namespace, ignore = [] ) => ( node ) => {
	/**
	 * Updates selector if necessary.
	 *
	 * @param {string} selector Selector to modify.
	 *
	 * @return {string} Updated selector.
	 */
	const updateSelector = ( selector ) => {
		if ( ignore.includes( selector.trim() ) ) {
			return selector;
		}

		// Anything other than a root tag is always prefixed.
		{
			if ( ! selector.match( IS_ROOT_TAG ) ) {
				return namespace + ' ' + selector;
			}
		}

		// HTML and Body elements cannot be contained within our container so lets extract their styles.
		return selector.replace( /^(body|html|:root)/, namespace );
	};

	if ( node.type === 'rule' ) {
		return {
			...node,
			selectors: node.selectors.map( updateSelector ),
		};
	}

	return node;
};

export default wrap;
