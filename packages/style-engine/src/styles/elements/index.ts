/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
// @ts-ignore (Reason: Could not find a declaration file for module '@wordpress/blocks)
import { __EXPERIMENTAL_ELEMENTS as ELEMENTS } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import type { Style, StyleOptions, GeneratedCSSRule } from '../../types';
import { getCSSRules } from '../../';

const elements = {
	name: 'elements',
	generate: ( style: Style, options: StyleOptions ) => {
		const elementsStyles: object | undefined = get( style, [ 'elements' ] );

		if ( elementsStyles ) {
			const selectorRules = Object.entries( elementsStyles ).reduce(
				(
					acc: GeneratedCSSRule[][],
					[ elementName, elementStyles ]: [ string, Style ]
				) => {
					const elementTag = ELEMENTS[ elementName ];

					if ( ! elementTag ) {
						return acc;
					}

					const newOptions = {
						...options,
						selector: options?.selector
							? `${ options?.selector } ${ elementTag }`
							: elementTag,
					};

					acc.push( getCSSRules( elementStyles, newOptions ) );
					return acc;
				},
				[]
			);
			return selectorRules.flat();
		}

		return [];
	},
};

export default [ elements ];
