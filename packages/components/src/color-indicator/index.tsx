/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import type { ColorIndicatorProps } from './types';

function UnforwardedColorIndicator(
	props: WordPressComponentProps< ColorIndicatorProps, 'span', false >,
	forwardedRef: ForwardedRef< HTMLSpanElement >
) {
	const { className, colorValue, ...additionalProps } = props;

	return (
		<span
			className={ clsx( 'component-color-indicator', className ) }
			style={ { background: colorValue } }
			ref={ forwardedRef }
			{ ...additionalProps }
		/>
	);
}

/**
 * ColorIndicator is a React component that renders a specific color in a
 * circle. It's often used to summarize a collection of used colors in a child
 * component.
 *
 * ```jsx
 * import { ColorIndicator } from '@wordpress/components';
 *
 * const MyColorIndicator = () => <ColorIndicator colorValue="#0073aa" />;
 * ```
 */
export const ColorIndicator = forwardRef( UnforwardedColorIndicator );

export default ColorIndicator;
