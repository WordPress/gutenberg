import type { FieldsScriptParts } from '@wordpress/fields-loader';
import PostContentInfoView from './view';
import type { PostWithContent } from './types';

/**
 * The JavaScript parts of the content information field; its data is in
 * `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithContent >[ string ] = {
	render: PostContentInfoView,
};
