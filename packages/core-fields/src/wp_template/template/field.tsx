import type { FieldsScriptParts } from '../../types';
import TemplateEdit from './edit';
import TemplateView from './view';
import type { TemplateWithTemplate } from './types';

/**
 * The JavaScript parts of the template field of a template; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< TemplateWithTemplate >[ string ] =
	{
		Edit: TemplateEdit,
		render: TemplateView,
	};
