import { forwardRef, useContext, useEffect, useId } from '@wordpress/element';
import { HeaderDescriptionIdContext } from './context';
import type { HeaderDescriptionProps } from './types';

/**
 * Secondary content placed in the collapsible card header that describes
 * the trigger button via `aria-describedby`. Use it for supplementary
 * information such as status badges or summary values.
 *
 * The content is visually rendered but marked `aria-hidden` so that
 * assistive technologies consume it only through the `aria-describedby`
 * relationship on the trigger, avoiding double announcements.
 *
 * Avoid interactive elements (buttons, links, inputs) inside this
 * component — the entire header is the toggle trigger.
 */
export const HeaderDescription = forwardRef<
	HTMLDivElement,
	HeaderDescriptionProps
>( function CollapsibleCardHeaderDescription(
	{ children, className, ...restProps },
	ref
) {
	const descriptionId = useId();
	const { setDescriptionId } = useContext( HeaderDescriptionIdContext );

	useEffect( () => {
		setDescriptionId( descriptionId );
		return () => setDescriptionId( undefined );
	}, [ descriptionId, setDescriptionId ] );

	return (
		<div
			ref={ ref }
			id={ descriptionId }
			aria-hidden="true"
			className={ className }
			{ ...restProps }
		>
			{ children }
		</div>
	);
} );
