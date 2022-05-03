/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const fontSize = {
	name: 'fontSize',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'fontSize' ],
			'fontSize',
			options
		);
	},
};

const fontWeight = {
	name: 'fontSize',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'fontWeight' ],
			'fontWeight',
			options
		);
	},
};

const letterSpacing = {
	name: 'letterSpacing',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'letterSpacing' ],
			'letterSpacing',
			options
		);
	},
};

const lineHeight = {
	name: 'letterSpacing',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'lineHeight' ],
			'lineHeight',
			options
		);
	},
};

const textDecoration = {
	name: 'textDecoration',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'textDecoration' ],
			'textDecoration',
			options
		);
	},
};

const textTransform = {
	name: 'textTransform',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			[ 'typography', 'textTransform' ],
			'textTransform',
			options
		);
	},
};

export default [
	fontSize,
	fontWeight,
	letterSpacing,
	lineHeight,
	textDecoration,
	textTransform,
];
