/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../ui/context';
import type { ColorIndicatorProps } from './types';

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
export function ColorIndicator(
	// ref is omitted until we have `WordPressComponentPropsWithoutRef` or add
	// ref forwarding to ColorIndicator.
	props: Omit<
		WordPressComponentProps< ColorIndicatorProps, 'span', false >,
		'ref'
	>
) {
	const { className, colorValue, ...additionalProps } = props;

	return (
		<span
			className={ classnames( 'component-color-indicator', className ) }
			style={ { background: colorValue } }
			{ ...additionalProps }
		/>
	);
}

export default ColorIndicator;
