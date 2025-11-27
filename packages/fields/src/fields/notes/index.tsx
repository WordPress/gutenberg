/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

interface PostWithNotesCount extends BasePost {
	_notesCount?: number;
}

const notesField: Field< PostWithNotesCount > = {
	id: '_notesCount',
	label: __( 'Notes' ),
	type: 'integer',
};

/**
 * Notes count field for post types that support editor.notes.
 */
export default notesField;
