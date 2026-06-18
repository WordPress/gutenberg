/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Template } from '../../types';

// A template is editable only when it's a user-created custom template.
// Theme-provided templates surface a read-only description instead.
const isCustomTemplate = ( item: Template ) =>
	item.source === 'custom' && ! item.has_theme_file && item.is_custom;

const getValue = ( { item }: { item: Template } ) =>
	decodeEntities( item.description || '' );

const render = ( { item }: { item: Template } ) => {
	const { description } = item;
	return description && <Text>{ decodeEntities( description ) }</Text>;
};

const descriptionField: Field< Template > = {
	id: 'description',
	type: 'text',
	label: __( 'Description' ),
	placeholder: __( 'Add a description' ),
	getValue,
	render,
	Edit: {
		control: 'textarea',
		rows: 4,
	},
	isVisible: isCustomTemplate,
	enableSorting: false,
	filterBy: false,
	enableGlobalSearch: true,
};

/**
 * Read-only description field for theme-provided templates, which can't be
 * edited. Shares the display config with `descriptionField` but renders as
 * read-only and is only visible when a description exists.
 */
export const readOnlyDescriptionField: Field< Template > = {
	id: 'description_readonly',
	type: 'text',
	label: __( 'Description' ),
	getValue,
	render,
	readOnly: true,
	isVisible: ( item ) => ! isCustomTemplate( item ) && !! item.description,
	enableSorting: false,
	filterBy: false,
};

/**
 * Description field for templates.
 */
export default descriptionField;
