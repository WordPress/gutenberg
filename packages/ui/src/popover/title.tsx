import { Popover as _Popover } from '@base-ui/react/popover';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useLayoutEffect, useRef } from '@wordpress/element';
import { Text } from '../text';
import { usePopoverValidationContext } from './context';
import type { TitleProps } from './types';

/**
 * Renders a heading that labels the popover for accessibility.
 *
 * **Required** — every popover must include a `Popover.Title`, even if
 * visually hidden. The rendered element is linked to the popup via
 * `aria-labelledby`. Uses the `heading-xl` text variant, matching Dialog.
 *
 * To visually hide the title while keeping it accessible, wrap it with
 * `VisuallyHidden` using the `render` prop:
 *
 * ```jsx
 * <VisuallyHidden render={ <Popover.Title /> }>
 *   Accessible title text
 * </VisuallyHidden>
 * ```
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function PopoverTitle(
		{ className, children, render, ...props },
		forwardedRef
	) {
		const validationContext = usePopoverValidationContext();
		const internalRef = useRef< HTMLHeadingElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		useLayoutEffect( () => {
			validationContext?.registerTitle( internalRef.current );
		}, [ validationContext ] );

		return (
			<Text
				ref={ mergedRef }
				variant="heading-xl"
				render={ <_Popover.Title render={ render } { ...props } /> }
				className={ className }
			>
				{ children }
			</Text>
		);
	}
);

export { Title };
