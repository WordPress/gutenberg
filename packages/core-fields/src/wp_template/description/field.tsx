import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { getValue, isCustomTemplate, render } from './utils';
import type { TemplateWithDescription } from './utils';

/**
 * The JavaScript parts of the template description field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< TemplateWithDescription >[ string ] =
	{
		getValue,
		render,
		isVisible: isCustomTemplate,
	};
