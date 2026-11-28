import { __ } from '@wordpress/i18n';
import { tabPanel as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';

const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: __( 'Type / to choose a block' ),
		},
	],
];

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	template: TEMPLATE,
	__experimentalLabel( attributes, { context } ) {
		const { label } = attributes;

		const customName = attributes?.metadata?.name;
		const hasLabel = label?.trim().length > 0;

		if ( context === 'list-view' && ( customName || hasLabel ) ) {
			return customName || label;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
