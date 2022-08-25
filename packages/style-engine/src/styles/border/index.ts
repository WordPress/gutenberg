/**
 * Internal dependencies
 */
import { camelCase } from 'lodash';
import type {
	BorderIndividualProperty,
	Style,
	StyleDefinition,
	StyleOptions,
} from '../../types';
import { generateRule, generateBoxRules } from '../utils';

const color: StyleDefinition = {
	name: 'color',
	generate: ( style, options ) => {
		return generateRule(
			style,
			options,
			[ 'border', 'color' ],
			'borderColor'
		);
	},
};

const radius: StyleDefinition = {
	name: 'radius',
	generate: ( style, options ) => {
		return generateBoxRules(
			style,
			options,
			[ 'border', 'radius' ],
			{
				default: 'borderRadius',
				individual: 'border%sRadius',
			},
			[ 'topLeft', 'topRight', 'bottomLeft', 'bottomRight' ]
		);
	},
};

const borderStyle: StyleDefinition = {
	name: 'style',
	generate: ( style, options ) => {
		return generateRule(
			style,
			options,
			[ 'border', 'style' ],
			'borderStyle'
		);
	},
};

const width: StyleDefinition = {
	name: 'width',
	generate: ( style, options ) => {
		return generateRule(
			style,
			options,
			[ 'border', 'width' ],
			'borderWidth'
		);
	},
};

/**
 * Returns a curried generator function with the individual border property ('top' | 'right' | 'bottom' | 'left') baked in.
 *
 * @param  individualProperty Individual border property ('top' | 'right' | 'bottom' | 'left').
 *
 * @return StyleDefinition[ 'generate' ]
 */
const createBorderGenerateFunction =
	( individualProperty: BorderIndividualProperty ) =>
	( style: Style, options: StyleOptions ) => {
		return [ 'color', 'style', 'width' ].flatMap( ( key ) => {
			const path = [ 'border', individualProperty, key ];
			return generateRule(
				style,
				options,
				path,
				camelCase( path.join( ' ' ) )
			);
		} );
	};

const borderTop: StyleDefinition = {
	name: 'borderTop',
	generate: createBorderGenerateFunction( 'top' ),
};

const borderRight: StyleDefinition = {
	name: 'borderRight',
	generate: createBorderGenerateFunction( 'right' ),
};

const borderBottom: StyleDefinition = {
	name: 'borderBottom',
	generate: createBorderGenerateFunction( 'bottom' ),
};

const borderLeft: StyleDefinition = {
	name: 'borderLeft',
	generate: createBorderGenerateFunction( 'left' ),
};

export default [
	color,
	borderStyle,
	width,
	radius,
	borderTop,
	borderRight,
	borderBottom,
	borderLeft,
];
