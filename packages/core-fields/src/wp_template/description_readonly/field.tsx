import type { FieldsScriptParts } from '@wordpress/fields-loader';
import { getValue, isCustomTemplate, render } from '../description/utils';
import type { TemplateWithDescription } from '../description/utils';

/**
 * The JavaScript parts of the read-only template description field; its
 * data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< TemplateWithDescription >[ string ] =
	{
		getValue,
		render,
		// Shown when the description cannot be edited and there is one.
		isVisible: ( item ) =>
			! isCustomTemplate( item ) && !! item.description,
	};
