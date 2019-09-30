/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Columns' ),
	icon,
	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},
	example: {
		innerBlocks: [
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent et eros eu felis pellentesque efficitur. Nam dapibus felis malesuada tincidunt rhoncus. Integer non malesuada tortor.',
						},
					},
					{
						name: 'core/image',
						attributes: {
							url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Windbuchencom.jpg',
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Suspendisse commodo neque lacus, a dictum orci interdum et. Ut vel mi ut leo fringilla rutrum.',
						},
					},
				],
			},
			{
				name: 'core/column',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: __( 'Etiam et egestas lorem. Vivamus sagittis sit amet dolor quis lobortis. Integer sed fermentum arcu, id vulputate lacus. Etiam fermentum sem eu quam hendrerit, eget faucibus urna pulvinar.' ),
						},
					},
					{
						name: 'core/paragraph',
						attributes: {
							content: __( 'Nam risus massa, ullamcorper consectetur eros fermentum, porta aliquet ligula. Sed vel mauris nec enim ultricies commodo.' ),
						},
					},
				],
			},
		],
	},
	deprecated,
	edit,
	save,
};
