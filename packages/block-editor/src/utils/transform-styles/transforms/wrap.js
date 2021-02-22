/**
 * @constant string IS_ROOT_TAG Regex to check if the selector is a root tag selector.
 */
const IS_ROOT_TAG = /^(body|html|:root).*$/;

const IS_BUTTON_TAG = /^(button).*$/;

const IS_INPUT_TAG = /^(input).*$/;

const wrap = ( namespace, ignore = [] ) => ( node ) => {
	const updateSelector = ( selector ) => {
		if ( ignore.includes( selector.trim() ) ) {
			return selector;
		}

		// Anything other than a root tag is always prefixed.
		{
			if ( ! selector.match( IS_ROOT_TAG ) ) {
				if ( selector.match( IS_BUTTON_TAG ) ) {
					return (
						namespace +
						' ' +
						selector.replace(
							/^(button)/,
							'button:not(.components-button)'
						)
					);
				}

				if ( selector.match( IS_INPUT_TAG ) ) {
					return (
						namespace +
						' ' +
						selector.replace(
							/^(input)/,
							'input:not(.components-text-control__input):not(.components-placeholder__input):not(.components-form-token-field__input)'
						)
					);
				}

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
