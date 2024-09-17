/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { preformatted as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			/* eslint-disable @wordpress/i18n-no-collapsible-whitespace */
			// translators: Sample content for the Preformatted block. Can be replaced with a more locale-adequate work.
			content: __(
				'EXT. XANADU - FAINT DAWN - 1940 (MINIATURE)\nWindow, very small in the distance, illuminated.\nAll around this is an almost totally black screen. Now, as the camera moves slowly towards the window which is almost a postage stamp in the frame, other forms appear;'
			),
			/* eslint-enable @wordpress/i18n-no-collapsible-whitespace */
		},
	},
	transforms,
	edit,
	save,
	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + '\n\n' + attributesToMerge.content,
		};
	},
};

export const init = () => initBlock( { name, metadata, settings } );
