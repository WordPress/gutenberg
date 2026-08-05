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
 * Multiple header descriptions are combined in render order into the
 * trigger's accessible description. Pass `id` to control the ID used in
 * that relationship; otherwise, an ID is generated automatically.
 *
 * Avoid interactive elements (buttons, links, inputs) inside this
 * component — the entire header is the toggle trigger.
 */
export const HeaderDescription = forwardRef<
	HTMLDivElement,
	HeaderDescriptionProps
>( function CollapsibleCardHeaderDescription(
	{ children, className, id: idProp, ...restProps },
	ref
) {
	const generatedId = useId();
	const descriptionId = idProp ?? generatedId;
	const context = useContext( HeaderDescriptionIdContext );

	if ( process.env.NODE_ENV !== 'production' && ! context ) {
		throw new Error(
			'CollapsibleCard.HeaderDescription: Missing parent <CollapsibleCard.Header>. ' +
				'Render <CollapsibleCard.HeaderDescription> inside <CollapsibleCard.Header>.'
		);
	}

	useEffect( () => {
		return context?.registerDescriptionId( descriptionId );
	}, [ context, descriptionId ] );

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
