/**
 * WordPress dependencies
 */
import { accordionItem as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import initBlock from '../utils/init-block';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [ [ 'core/accordion-heading' ], [ 'core/accordion-panel' ] ];

export const settings = {
	icon,
	template: TEMPLATE,
	templateInsertUpdatesSelection: true,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
