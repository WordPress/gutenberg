/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { PolymorphicElement } from '../utils/polymorphic-element';

type ViewProps< T extends React.ElementType > = WordPressComponentProps<
	{},
	T
> & {
	/**
	 * Legacy Emotion prop accepted by `View`. It is intentionally consumed here
	 * so it does not leak to the rendered element after Emotion is removed.
	 */
	css?: unknown;
};

function UnforwardedView< T extends React.ElementType = 'div' >(
	{ css: _css, ...restProps }: ViewProps< T >,
	ref: React.ForwardedRef< any >
) {
	void _css;
	return <PolymorphicElement ref={ ref } { ...restProps } />;
}

/**
 * `View` is a core component that renders everything in the library.
 * It is the principle component in the entire library.
 *
 * ```jsx
 * import { View } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<View>
 * 			 Code is Poetry
 * 		</View>
 * 	);
 * }
 * ```
 */
export const View = Object.assign( forwardRef( UnforwardedView ), {
	selector: '.components-view',
} );

export default View;
