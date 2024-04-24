/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import icon from './icon';

import './style.scss';

const { name } = metadata;

export const settings = {
	icon,
	edit,
};

registerBlockType( name, settings );
