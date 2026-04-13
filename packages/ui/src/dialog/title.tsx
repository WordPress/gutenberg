import { Dialog as _Dialog } from '@base-ui/react/dialog';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useLayoutEffect, useRef } from '@wordpress/element';
import { Text } from '../text';
import { useDialogValidationContext } from './context';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Renders the dialog title. This component is required for accessibility
 * and serves as both the visible heading and the accessible label for
 * the dialog.
 *
 * **Required** — every dialog must include a `Dialog.Title`, even if
 * visually hidden. The rendered element is linked to the popup via
 * `aria-labelledby`. Renders an `<h2>` by default.
 *
 * To visually hide the title while keeping it accessible, wrap it with
 * `VisuallyHidden` using the `render` prop:
 *
 * ```jsx
 * <VisuallyHidden render={ <Dialog.Title /> }>
 *   Accessible title text
 * </VisuallyHidden>
 * ```
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function DialogTitle( { children, ...props }, forwardedRef ) {
		const validationContext = useDialogValidationContext();
		const internalRef = useRef< HTMLHeadingElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		// Register this title with the parent Popup for validation (dev only)
		useLayoutEffect( () => {
			validationContext?.registerTitle( internalRef.current );
		}, [ validationContext ] );

		return (
			<Text
				ref={ mergedRef }
				variant="heading-xl"
				render={ <_Dialog.Title { ...props } /> }
				className={ styles.title }
			>
				{ children }
			</Text>
		);
	}
);

export { Title };
