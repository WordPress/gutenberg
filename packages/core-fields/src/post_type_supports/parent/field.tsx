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
};
