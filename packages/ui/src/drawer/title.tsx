import { Drawer as _Drawer } from '@base-ui/react/drawer';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef } from '@wordpress/element';
import { Text } from '../text';
import { useDrawerValidationContext } from './context';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Renders the drawer title. This component is required for accessibility
 * and serves as both the visible heading and the accessible label for
 * the drawer.
 *
 * **Required** — every drawer must include a `Drawer.Title`, even if
 * visually hidden. The rendered element is linked to the popup via
 * `aria-labelledby`. Renders an `<h2>` by default.
 *
 * To visually hide the title while keeping it accessible, wrap it with
 * `VisuallyHidden` using the `render` prop:
 *
 * ```jsx
 * <VisuallyHidden render={ <Drawer.Title /> }>
 *   Accessible title text
 * </VisuallyHidden>
 * ```
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function DrawerTitle( { children, ...props }, forwardedRef ) {
		const validationContext = useDrawerValidationContext();
		const internalRef = useRef< HTMLHeadingElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		useEffect( () => {
			if ( validationContext ) {
				return validationContext.registerTitle( internalRef.current );
			}
			return undefined;
		}, [ validationContext ] );

		return (
			<Text
				ref={ mergedRef }
				variant="heading-xl"
				render={ <_Drawer.Title { ...props } /> }
				className={ styles.title }
			>
				{ children }
			</Text>
		);
	}
);

export { Title };
