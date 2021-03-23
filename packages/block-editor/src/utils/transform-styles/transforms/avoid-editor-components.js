/**
 * This transform targets inputs and buttons and prevents css styles for the editor
 * from the theme to bleed into the editor's components. It is a bit hacky but
 * it is contained and prevents us from having to do make changes over multiple files.
 *
 * @constant string IS_BUTTON_TAG Regex to check if the selector is a button tag selector.
 * @constant string IS_INPUT_TAG Regex to check if the selector is an input tag selector.
 */
const IS_BUTTON_TAG = /^(button).*$/;

const IS_INPUT_TAG = /^(input).*$/;

const avoidEditorComponents = ( ignore = [] ) => ( node ) => {
	const updateSelector = ( selector ) => {
		if ( ignore.includes( selector.trim() ) ) {
			return selector;
		}

		if ( selector.match( IS_BUTTON_TAG ) ) {
			return selector.replace(
				IS_BUTTON_TAG,
				'button:not(.components-button):not([id^=mceu_])'
			);
		}

		if ( selector.match( IS_INPUT_TAG ) ) {
			return selector.replace(
				IS_INPUT_TAG,
				'input:not(.components-text-control__input):not(.components-placeholder__input):not(.components-form-token-field__input)'
			);
		}

		return selector;
	};

	if ( node.type === 'rule' ) {
		return {
			...node,
			selectors: node.selectors.map( updateSelector ),
		};
	}

	return node;
};

export default avoidEditorComponents;
