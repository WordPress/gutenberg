/**
 * Internal dependencies
 */
import type { Style, StyleOptions } from '../../types';
import { generateRule } from '../utils';
import { VARIABLE_REFERENCE_PREFIX } from '../constants';

const gradient = {
	name: 'gradient',
	generate: ( style: Style, options: StyleOptions ) => {
		// If there's a background image process it via backgroundImage.
		const hasBackgroundImage =
			typeof style?.background?.backgroundImage === 'string' ||
			typeof style?.background?.backgroundImage?.url === 'string';
		if (
			hasBackgroundImage ||
			// Temp. workaround for the case when the gradient is a variable.
			// Gradient presets are usually added via the `has-` classnames
			// anyway, so it's safe to turn off, I think. Not ideal.
			( typeof style?.color?.gradient === 'string' &&
				style.color.gradient.startsWith( VARIABLE_REFERENCE_PREFIX ) )
		) {
			return [];
		}

		return generateRule(
			style,
			options,
			[ 'color', 'gradient' ],
			'background'
		);
	},
};

export default gradient;
