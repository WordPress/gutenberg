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
			options,
			[ 'typography', 'fontSize' ],
			'fontSize'
		);
	},
};

const fontStyle = {
	name: 'fontStyle',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontStyle' ],
			'fontStyle'
		);
	},
};

const fontWeight = {
	name: 'fontWeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontWeight' ],
			'fontWeight'
		);
	},
};

const fontFamily = {
	name: 'fontFamily',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'fontFamily' ],
			'fontFamily'
		);
	},
};

const letterSpacing = {
	name: 'letterSpacing',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'letterSpacing' ],
			'letterSpacing'
		);
	},
};

const lineHeight = {
	name: 'lineHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'lineHeight' ],
			'lineHeight'
		);
	},
};

const textColumns = {
	name: 'textColumns',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textColumns' ],
			'columnCount'
		);
	},
};

const textDecoration = {
	name: 'textDecoration',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textDecoration' ],
			'textDecoration'
		);
	},
};

const textTransform = {
	name: 'textTransform',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'textTransform' ],
			'textTransform'
		);
	},
};

const writingMode = {
	name: 'writingMode',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'typography', 'writingMode' ],
			'writingMode'
		);
	},
};

export default [
	fontFamily,
	fontSize,
	fontStyle,
	fontWeight,
	letterSpacing,
	lineHeight,
	textColumns,
	textDecoration,
	textTransform,
	writingMode,
];
