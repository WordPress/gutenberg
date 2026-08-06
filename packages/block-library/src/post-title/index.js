/**
 * WordPress dependencies
 */
import { title as icon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { store as coreEditorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,

	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/heading' ],
				transform: () => {
					const postTitle =
						select( coreEditorStore ).getEditedPostAttribute(
							'title'
						);

					return createBlock( 'core/heading', {
						content: postTitle || '',
						level: 1,
					} );
				},
			},
		],
	},
};

export const init = () => initBlock( { name, metadata, settings } );
