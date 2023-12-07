/**
 * WordPress dependencies
 */
import { listItem as icon } from '@wordpress/icons';
import { privateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import lazyLoad from '../utils/lazy-load';
import initBlock from '../utils/init-block';
import metadata from './block.json';

import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit: lazyLoad( () =>
		import( /* webpackChunkName: "list-item/editor" */ './edit' )
	),
	save,
	merge( attributes, attributesToMerge ) {
		return {
			...attributes,
			content: attributes.content + attributesToMerge.content,
		};
	},
	transforms,
	[ unlock( privateApis ).requiresWrapperOnCopy ]: true,
};

export const init = () => initBlock( { name, metadata, settings } );
