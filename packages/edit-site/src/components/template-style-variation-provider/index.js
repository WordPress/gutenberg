/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { TemplateStyleVariationProvider } = unlock( editorPrivateApis );

export default TemplateStyleVariationProvider;
