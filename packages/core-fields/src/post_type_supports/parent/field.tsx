import type { FieldsScriptParts } from '../../types';
import { ParentEdit } from './edit';
import { ParentView } from './view';
import type { PostWithParent } from './types';

/**
 * The JavaScript parts of the parent field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithParent >[ string ] = {
	Edit: ParentEdit,
	render: ParentView,
	// A page can't be its own parent, as one of several pages edited at once
	// becomes when it is picked as the parent of the others.
	isDisabled: ( { item } ) =>
		!! item.id && String( item.parent ) === String( item.id ),
};
