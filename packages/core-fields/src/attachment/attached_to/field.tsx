import type { FieldsScriptParts } from '../../types';
import type { MediaItem } from '../types';
import MediaAttachedToEdit from './edit';
import MediaAttachedToView from './view';

/**
 * The JavaScript parts of the attached to field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< MediaItem >[ string ] = {
	Edit: MediaAttachedToEdit,
	render: MediaAttachedToView,
};
