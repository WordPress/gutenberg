import { registerBlockType } from '@wordpress/blocks';
import edit from './edit';
import save from './save';
import { supports } from './block.json';

registerBlockType( 'core/marquee', {
	title: 'Marquee',
	description: 'A scrolling block',
	category: 'text',
	icon: 'smiley',
	supports,
	edit,
	save,
} );
