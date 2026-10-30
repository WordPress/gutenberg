import { _x, sprintf } from '@wordpress/i18n';
import { customLink as linkIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import deprecated from './deprecated';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import { enhanceNavigationLinkVariations } from './hooks';
import transforms from './transforms';
import variations from './variations';

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

	deprecated,
	transforms,
	variations,
};

export const init = () => {
	addFilter(
		'blocks.registerBlockType',
		'core/navigation-link',
		enhanceNavigationLinkVariations
	);

	return initBlock( { name, metadata, settings } );
};
