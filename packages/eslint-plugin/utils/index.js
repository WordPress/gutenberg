const { TRANSLATION_FUNCTIONS, REGEXP_PLACEHOLDER } = require( './constants' );
const { getTranslateStrings } = require( './get-translate-strings' );
const { getTextContentFromNode } = require( './get-text-content-from-node' );
const { getTranslateFunctionName } = require( './get-translate-function-name' );

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
	getTranslateStrings,
	getTextContentFromNode,
	getTranslateFunctionName,
};
