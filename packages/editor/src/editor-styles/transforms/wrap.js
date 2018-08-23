/**
 * @const string IS_ROOT_TAG Regex to check if the selector is a root tag selector.
 */
const IS_ROOT_TAG = /^(body|html).*$/;

export const wrap = ( namespace ) => ( node ) => {
	const updateSelector = ( selector ) => {
		// Anything other than a root tag is always prefixed.
		if ( ! selector.match( IS_ROOT_TAG ) ) {
			return namespace + ' ' + selector;
		}

		// HTML and Body elements cannot be contained within our container so lets extract their styles.
		return selector.replace( /^(body|html)/, namespace );
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
