import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useLayoutEffect, useRef } from '@wordpress/element';
import { Text } from '../text';
import { usePopoverValidationContext } from './context';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Renders a heading that labels the popover for accessibility.
 * This component is required — every popover must include a title,
 * even if visually hidden.
 */
const Title = forwardRef< HTMLHeadingElement, TitleProps >(
	function PopoverTitle( { className, children, ...props }, forwardedRef ) {
		const validationContext = usePopoverValidationContext();
		const internalRef = useRef< HTMLHeadingElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		useLayoutEffect( () => {
			validationContext?.registerTitle( internalRef.current );
		}, [ validationContext ] );

		return (
			<Text
				variant="heading-md"
				render={ <_Popover.Title ref={ mergedRef } { ...props } /> }
				className={ clsx( styles.title, className ) }
			>
				{ children }
			</Text>
		);
	}
);

export { Title };
