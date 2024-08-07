/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DisclosureContentProps } from './types';
import type { WordPressComponentProps } from '../context';

/**
 * Accessible Disclosure component that controls visibility of a section of
 * content. It follows the WAI-ARIA Disclosure Pattern.
 */
const UnforwardedDisclosureContent = (
	{
		visible,
		children,
		...props
	}: WordPressComponentProps< DisclosureContentProps, 'div', false >,
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
