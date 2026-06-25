/**
 * WordPress dependencies
 */
import type { Field } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplateAuthorView from './view';
import type { Template, TemplatePart } from '../../types';

async function getAuthorElements(
	postType: 'wp_template' | 'wp_template_part'
) {
	const records = ( await resolveSelect( coreStore ).getEntityRecords(
		'postType',
		postType,
		{ per_page: -1, _fields: 'id,author_text' }
	) ) as ( Template | TemplatePart )[] | null;

	const seen = new Set< string >();
	const elements: { value: string; label: string }[] = [];
	for ( const record of records ?? [] ) {
		const value = record.author_text;
		if ( value && ! seen.has( value ) ) {
			seen.add( value );
			elements.push( { value, label: value } );
		}
	}
	return elements;
}

/**
 * Author field for templates.
 */
export const templateAuthorField: Field< Template > = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	getElements: () => getAuthorElements( 'wp_template' ),
};

/**
 * Author field for template parts.
 */
export const templatePartAuthorField: Field< TemplatePart > = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item } ) => item.author_text,
	render: TemplateAuthorView,
	enableSorting: false,
	filterBy: {
		isPrimary: true,
	},
	getElements: () => getAuthorElements( 'wp_template_part' ),
};
