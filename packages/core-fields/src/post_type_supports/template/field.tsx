import type { FieldsScriptParts } from '@wordpress/fields-loader';
import TemplateEdit from './edit';
import TemplateView from './view';
import type { PostWithTemplate } from './types';

/**
 * The JavaScript parts of the template field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithTemplate >[ string ] =
	{
		Edit: TemplateEdit,
		render: TemplateView,
	};
