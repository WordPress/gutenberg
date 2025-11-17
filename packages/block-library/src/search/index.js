/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: { buttonText: __( 'Search' ), label: __( 'Search' ) },
		viewportWidth: 400,
	},
	variations,
	edit,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings.fields = [
		{
			label: __( 'Label' ),
			type: 'RichText',
			shownByDefault: true,
			mapping: {
				value: 'label',
			},
		},
		{
			label: __( 'Button text' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'buttonText',
			},
		},
		{
			label: __( 'Placeholder' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'placeholder',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
