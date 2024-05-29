/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';

const color = {
	name: 'color',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'outline', 'color' ],
		ruleKey: string = 'outlineColor'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const offset = {
	name: 'offset',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'outline', 'offset' ],
		ruleKey: string = 'outlineOffset'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const outlineStyle = {
	name: 'style',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'outline', 'style' ],
		ruleKey: string = 'outlineStyle'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const width = {
	name: 'width',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'outline', 'width' ],
		ruleKey: string = 'outlineWidth'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

export default [ color, outlineStyle, offset, width ];
