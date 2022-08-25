/**
 * External dependencies
 */
import { camelCase } from 'change-case';

/**
 * Internal dependencies
 */
import type { BoxEdge, GenerateFunction, StyleDefinition } from '../../types';
import { generateRule, generateBoxRules } from '../utils';

function createBorderGenerateFunction( path: string[] ): GenerateFunction {
	return ( style, options ) =>
		generateRule( style, options, path, camelCase( path.join( ' ' ) ) );
}

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
