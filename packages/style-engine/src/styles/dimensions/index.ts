/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const height = {
	name: 'height',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'height' ],
			'height'
		);
	},
};

const minHeight = {
	name: 'minHeight',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'minHeight' ],
			'minHeight'
		);
	},
};

const minWidth = {
	name: 'minWidth',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'minWidth' ],
			'minWidth'
		);
	},
};

const aspectRatio = {
	name: 'aspectRatio',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'aspectRatio' ],
			'aspectRatio'
		);
	},
};

const width = {
	name: 'width',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'width' ],
			'width'
		);
	},
};

const objectFit = {
	name: 'objectFit',
	generate: ( style: Style, options: StyleOptions ) => {
		return generateRule(
			style,
			options,
			[ 'dimensions', 'objectFit' ],
			'objectFit'
		);
	},
};

export default [ height, minHeight, minWidth, aspectRatio, width, objectFit ];
