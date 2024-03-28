/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DisclosureContentProps as DisclosureContentBaseProps } from './types';
import type { WordPressComponentProps } from '../context';

export type DisclosureContentProps = WordPressComponentProps<
	DisclosureContentBaseProps,
	'div',
	false
>;

/**
 * Accessible Disclosure component that controls visibility of a section of
 * content. It follows the WAI-ARIA Disclosure Pattern.
 */
const UnforwardedDisclosureContent = (
	{ visible, children, ...props }: DisclosureContentProps,
	ref: React.ForwardedRef< any >
) => {
	const disclosure = Ariakit.useDisclosureStore( { open: visible } );

	return (
		<Ariakit.DisclosureContent
			store={ disclosure }
			ref={ ref }
			{ ...props }
		>
			{ children }
		</Ariakit.DisclosureContent>
	);
};

export const DisclosureContent = forwardRef( UnforwardedDisclosureContent );
export default DisclosureContent;
