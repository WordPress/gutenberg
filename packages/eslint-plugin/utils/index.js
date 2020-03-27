const { TRANSLATION_FUNCTIONS, REGEXP_PLACEHOLDER } = require( './constants' );
const { getTranslateFunctionArgs } = require( './get-translate-function-args' );
const { getTextContentFromNode } = require( './get-text-content-from-node' );
const { getTranslateFunctionName } = require( './get-translate-function-name' );

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_PLACEHOLDER,
	getTranslateFunctionArgs,
	getTextContentFromNode,
	getTranslateFunctionName,
};
