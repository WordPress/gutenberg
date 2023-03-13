/**
 * Internal dependencies
 */
import type { BoxEdge, GenerateFunction, StyleDefinition } from '../../types';
import { generateRule, generateBoxRules, camelCaseJoin } from '../utils';

/**
 * Creates a function for generating CSS rules when the style path is the same as the camelCase CSS property used in React.
 *
 * @param path An array of strings representing the path to the style value in the style object.
 *
 * @return A function that generates CSS rules.
 */
function createBorderGenerateFunction( path: string[] ): GenerateFunction {
	return ( style, options ) =>
		generateRule( style, options, path, camelCaseJoin( path ) );
}

/**
 * Creates a function for generating border-{top,bottom,left,right}-{color,style,width} CSS rules.
 *
 * @param edge The edge to create CSS rules for.
 *
 * @return A function that generates CSS rules.
 */
function createBorderEdgeGenerateFunction( edge: BoxEdge ): GenerateFunction {
	return ( style, options ) => {
		return [ 'color', 'style', 'width' ].flatMap( ( key ) => {
			const path = [ 'border', edge, key ];
			return createBorderGenerateFunction( path )( style, options );
		} );
	};
}

const color: StyleDefinition = {
	name: 'color',
	generate: createBorderGenerateFunction( [ 'border', 'color' ] ),
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
	generate: createBorderGenerateFunction( [ 'border', 'style' ] ),
};

const width: StyleDefinition = {
	name: 'width',
	generate: createBorderGenerateFunction( [ 'border', 'width' ] ),
};

const borderTop: StyleDefinition = {
	name: 'borderTop',
	generate: createBorderEdgeGenerateFunction( 'top' ),
};

const borderRight: StyleDefinition = {
	name: 'borderRight',
	generate: createBorderEdgeGenerateFunction( 'right' ),
};

const borderBottom: StyleDefinition = {
	name: 'borderBottom',
	generate: createBorderEdgeGenerateFunction( 'bottom' ),
};

const borderLeft: StyleDefinition = {
	name: 'borderLeft',
	generate: createBorderEdgeGenerateFunction( 'left' ),
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
