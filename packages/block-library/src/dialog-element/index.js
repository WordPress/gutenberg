/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal Dependencies
 */

import icon from './icon';
import edit from './edit';
import save from './save';
import './style.scss';
import './editor.scss';
import registerDialogElementLabelBinding from './block-bindings';

import metadata from './block.json';

const { name } = metadata;

const settings = {
	icon,
	edit,
	save,
};

registerBlockType(name, { ...metadata, ...settings });

registerDialogElementLabelBinding();
