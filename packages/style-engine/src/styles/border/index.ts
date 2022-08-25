/**
 * Internal dependencies
 */
import { camelCase } from 'lodash';
import type { BoxEdges, GenerateFunction, StyleDefinition } from '../../types';
import { generateRule, generateBoxRules } from '../utils';

function makeGenerateRule( path: string[] ): GenerateFunction {
	return ( style, options ) =>
		generateRule( style, options, path, camelCase( path.join( ' ' ) ) );
}

function createBorderGenerateFunction(
	individualProperty: BoxEdges
): GenerateFunction {
	return ( style, options ) => {
		return [ 'color', 'style', 'width' ].flatMap( ( key ) => {
			const path = [ 'border', individualProperty, key ];
			return makeGenerateRule( path )( style, options );
		} );
	};
}

const color: StyleDefinition = {
	name: 'color',
	generate: makeGenerateRule( [ 'border', 'color' ] ),
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
	generate: makeGenerateRule( [ 'border', 'style' ] ),
};

const width: StyleDefinition = {
	name: 'width',
	generate: makeGenerateRule( [ 'border', 'width' ] ),
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
