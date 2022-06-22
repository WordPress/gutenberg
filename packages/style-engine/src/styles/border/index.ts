/**
 * Internal dependencies
 */
import type {
	BorderIndividualStyles,
	BorderIndividualProperty,
	GeneratedCSSRule,
	Style,
	StyleDefinition,
	StyleOptions,
} from '../../types';
import { generateRule, generateBoxRules, upperFirst } from '../utils';

const color = {
	name: 'color',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'border', 'color' ],
		ruleKey: string = 'borderColor'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const radius = {
	name: 'radius',
	generate: ( style: Style, options: StyleOptions ): GeneratedCSSRule[] => {
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

const borderStyle = {
	name: 'style',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'border', 'style' ],
		ruleKey: string = 'borderStyle'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const width = {
	name: 'width',
	generate: (
		style: Style,
		options: StyleOptions,
		path: string[] = [ 'border', 'width' ],
		ruleKey: string = 'borderWidth'
	): GeneratedCSSRule[] => {
		return generateRule( style, options, path, ruleKey );
	},
};

const borderDefinitionsWithIndividualStyles: StyleDefinition[] = [
	color,
	borderStyle,
	width,
];

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
		const styleValue:
			| BorderIndividualStyles< typeof individualProperty >
			| undefined = style?.border?.[ individualProperty ];

		if ( ! styleValue ) {
			return [];
		}

		return borderDefinitionsWithIndividualStyles.reduce(
			(
				acc: GeneratedCSSRule[],
				borderDefinition: StyleDefinition
			): GeneratedCSSRule[] => {
				const key = borderDefinition.name;
				if (
					styleValue.hasOwnProperty( key ) &&
					typeof borderDefinition.generate === 'function'
				) {
					const ruleKey = `border${ upperFirst(
						individualProperty
					) }${ upperFirst( key ) }`;
					acc.push(
						...borderDefinition.generate(
							style,
							options,
							[ 'border', individualProperty, key ],
							ruleKey
						)
					);
				}
				return acc;
			},
			[]
		);
	};

const borderTop = {
	name: 'borderTop',
	generate: createBorderGenerateFunction( 'top' ),
};

const borderRight = {
	name: 'borderRight',
	generate: createBorderGenerateFunction( 'right' ),
};

const borderBottom = {
	name: 'borderBottom',
	generate: createBorderGenerateFunction( 'bottom' ),
};

const borderLeft = {
	name: 'borderLeft',
	generate: createBorderGenerateFunction( 'left' ),
};

export default [
	...borderDefinitionsWithIndividualStyles,
	radius,
	borderTop,
	borderRight,
	borderBottom,
	borderLeft,
];
