/**
 * Internal dependencies
 */
import { bold } from './bold';
import { code } from './code';
import { image } from './image';
import { italic } from './italic';
import { link } from './link';
import { strikethrough } from './strikethrough';
import { underline } from './underline';
import { textColor } from './text-color';
import { subscript } from './subscript';
import { superscript } from './superscript';
import { keyboard } from './keyboard';

const caret = {
	name: 'asblocks/caret',
	title: 'Example',
	tagName: 'mark',
	className: 'caret',
	attributes: {
		id: 'id',
		className: 'class',
	},
	edit() {
		return null;
	},
	__experimentalGetPropsForEditableTreePreparation(
		select,
		{ blockClientId }
	) {
		return {
			carets: select( 'core/block-editor' ).getBlockName( blockClientId ),
		};
	},
	__experimentalCreatePrepareEditableTree() {
		return ( formats ) => {
			return formats;
		};
	},
};

export default [
	caret,
	bold,
	code,
	image,
	italic,
	link,
	strikethrough,
	underline,
	textColor,
	subscript,
	superscript,
	keyboard,
];
