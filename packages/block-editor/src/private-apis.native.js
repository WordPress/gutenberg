/**
 * Internal dependencies
 */
import * as globalStyles from './components/global-styles';
import { ExperimentalBlockEditorProvider } from './components/provider';
import { getRichTextValues } from './components/rich-text/get-rich-text-values';
import { lock } from './lock-unlock';
import { PrivateRichText } from './components/rich-text/';
import HTMLElementControl from './components/html-element-control';

/**
 * Private @wordpress/block-editor APIs.
 */
export const privateApis = {};
lock( privateApis, {
	...globalStyles,
	ExperimentalBlockEditorProvider,
	getRichTextValues,
	PrivateRichText,
	HTMLElementControl,
} );
