/**
 * Internal dependencies
 */
const {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
} = require( './constants' );
const { getTranslateFunctionArgs } = require( './get-translate-function-args' );
const { getTextContentFromNode } = require( './get-text-content-from-node' );
const { getTranslateFunctionName } = require( './get-translate-function-name' );
const isPackageInstalled = require( './is-package-installed' );

module.exports = {
	TRANSLATION_FUNCTIONS,
	REGEXP_SPRINTF_PLACEHOLDER,
	REGEXP_SPRINTF_PLACEHOLDER_UNORDERED,
	getTranslateFunctionArgs,
	getTextContentFromNode,
	getTranslateFunctionName,
	isPackageInstalled,
};
