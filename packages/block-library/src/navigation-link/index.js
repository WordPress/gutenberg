/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { enhanceNavigationLinkVariations } from './hooks';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: linkIcon,

	__experimentalLabel: ( { label } ) => label,

	merge( leftAttributes, { label: rightLabel = '' } ) {
		return {
			...leftAttributes,
			label: leftAttributes.label + rightLabel,
		};
	},

	edit,

	save,

	example: {
		attributes: {
			label: _x( 'Example Link', 'navigation link preview example' ),
			url: 'https://example.com',
		},
	},

	deprecated: [
		{
			isEligible( attributes ) {
				return attributes.nofollow;
			},

			attributes: {
				label: {
					type: 'string',
				},
				type: {
					type: 'string',
				},
				nofollow: {
					type: 'boolean',
				},
				description: {
					type: 'string',
				},
				id: {
					type: 'number',
				},
				opensInNewTab: {
					type: 'boolean',
					default: false,
				},
				url: {
					type: 'string',
				},
			},

			migrate( { nofollow, ...rest } ) {
				return {
					rel: nofollow ? 'nofollow' : '',
					...rest,
				};
			},

			save() {
				return <InnerBlocks.Content />;
			},
		},
	],
	transforms,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'richtext',
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'link',
			mapping: {
				href: 'url',
				rel: 'rel',
				// TODO - opens in new tab? id?
			},
		},
	];
	settings[ formKey ] = {
		fields: [ 'label' ],
	};
}

export const init = () => {
	addFilter(
		'blocks.registerBlockType',
		'core/navigation-link',
		enhanceNavigationLinkVariations
	);

	return initBlock( { name, metadata, settings } );
};
