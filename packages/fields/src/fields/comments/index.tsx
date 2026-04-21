/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

import type { BasePost } from '../../types';

interface PostWithCommentsCount extends BasePost {
	commentsCount?: number;
}

const commentsField: Field< PostWithCommentsCount > = {
	id: 'commentsCount',
	label: __( 'Comments' ),
	type: 'integer',
	filterBy: {
		operators: [ 'is', 'lessThan', 'greaterThan' ],
	},
};

/**
 * Comments count field for post types that support comments.
 */
export default commentsField;
