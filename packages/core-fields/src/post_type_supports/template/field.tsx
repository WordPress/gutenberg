import { select } from '@wordpress/data';
import type { FieldsScriptParts } from '../../types';
import TemplateEdit from './edit';
import TemplateView from './view';
import type { PostWithTemplate } from './types';
import { hasTemplateFromReadingSettings } from './utils';

/**
 * The JavaScript parts of the template field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithTemplate >[ string ] =
	{
		Edit: TemplateEdit,
		render: TemplateView,
		// The reading settings assign the template of the front page and the
		// posts page. Without an id, as for several posts edited at once,
		// the caller asks for each post.
		isDisabled: ( { item } ) =>
			!! item.id &&
			hasTemplateFromReadingSettings( select, item.type, item.id ),
	};
