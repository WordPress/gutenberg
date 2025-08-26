/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import initBlock from '../utils/init-block';
import icon from './icon';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/accordion-content',
				innerBlocks: [
					{
						name: 'core/accordion-header',
						attributes: {
							title: 'Accordion Header Example 1',
						},
					},
				],
			},
			{
				name: 'core/accordion-content',
				innerBlocks: [
					{
						name: 'core/accordion-header',
						attributes: {
							title: 'Accordion Header Example 2',
						},
					},
				],
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
