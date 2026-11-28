import { select } from '@wordpress/data';
import type { FieldsScriptParts } from '../../types';
import { isTemplateSwitchable } from './is-template-switchable';
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
		// The front page and the posts page get their template from the
		// reading settings, so the field can't change it.
		isDisabled: ( { item } ) =>
			! isTemplateSwitchable( select, item.type, item.id ),
	};
