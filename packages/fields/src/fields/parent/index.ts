/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { ParentEdit } from './parent-edit';
import { ParentView } from './parent-view';

const parentField: Field< BasePost > = {
	id: 'parent',
	type: 'text',
	label: __( 'Parent' ),
	Edit: ParentEdit,
	render: ParentView,
	enableSorting: true,
	filterBy: false,
};

/**
 * Parent field for BasePost.
 */
export default parentField;
