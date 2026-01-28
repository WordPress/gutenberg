/**
 * WordPress dependencies
 */
import { page, addSubmenu } from '@wordpress/icons';
import { _x, __ } from '@wordpress/i18n';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: ( { context } ) => {
		if ( context === 'list-view' ) {
			return page;
		}
		return addSubmenu;
	},
	__experimentalLabel( attributes, { context } ) {
		const { label } = attributes;

		const customName = attributes?.metadata?.name;

		// In the list view and breadcrumb, use the block's menu label as the label.
		// If the menu label is empty, fall back to the default label.
		if (
			( context === 'list-view' || context === 'breadcrumb' ) &&
			customName
		) {
			return customName;
		}

		return label;
	},
	edit,
	example: {
		attributes: {
			label: _x( 'About', 'Example link text for Navigation Submenu' ),
			type: 'page',
		},
	},
	save,
	transforms,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'text',
			Edit: 'rich-text', //TODO: replace with custom component
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'url',
			Edit: 'link', // TODO: replace with custom component
			getValue: ( { item } ) => ( {
				url: item.url,
				rel: item.rel,
			} ),
			setValue: ( { value } ) => ( {
				url: value.url,
				rel: value.rel,
			} ),
		},
	];
	settings[ formKey ] = {
		fields: [ 'label', 'link' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
