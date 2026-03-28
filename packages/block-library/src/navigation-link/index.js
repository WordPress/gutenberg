/**
 * WordPress dependencies
 */
import { _x, __, sprintf } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';
import { addFilter } from '@wordpress/hooks';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import { FieldLinkPreview } from './shared/use-link-preview';
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

	__experimentalLabel( attributes, { context } ) {
		if ( context === 'list-view' ) {
			return attributes?.label;
		}

		if ( context === 'appender' ) {
			const type = attributes?.type || 'link';
			return sprintf(
				/* translators: %s: block type (e.g., 'page', 'post', 'category') */
				_x( 'Add %s', 'add default block type' ),
				type
			);
		}

		// Backwards compatibility - return label for unknown contexts
		return attributes?.label;
	},

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
			type: 'text',
			Edit: 'rich-text',
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'url',
			Edit: { control: 'link', Preview: FieldLinkPreview },
			getValue: ( { item } ) => ( {
				url: item.url,
				id: item.id,
				kind: item.kind,
				type: item.type,
				binding: item.metadata?.bindings?.url,
			} ),
			setValue: ( { item, value } ) => {
				const { url: _urlBinding, ...remainingBindings } =
					item.metadata?.bindings ?? {};
				const newBindings = value.binding
					? { ...remainingBindings, url: value.binding }
					: remainingBindings;
				return {
					url: value.url,
					id: value.id,
					kind: value.kind,
					type: value.type,
					metadata: {
						...item.metadata,
						bindings: Object.keys( newBindings ).length
							? newBindings
							: undefined,
					},
				};
			},
		},
		{
			id: 'opensInNewTab',
			label: __( 'Open in new tab' ),
			type: 'boolean',
		},
		{
			id: 'rel',
			label: __( 'Rel attribute' ),
			type: 'text',
		},
	];
	settings[ formKey ] = {
		fields: [ 'label', 'link', 'opensInNewTab', 'rel' ],
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
