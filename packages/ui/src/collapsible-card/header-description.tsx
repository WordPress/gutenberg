import clsx from 'clsx';
import { forwardRef, useContext, useEffect, useId } from '@wordpress/element';
import { HeaderDescriptionIdContext } from './context';
import type { HeaderDescriptionProps } from './types';
import { Text } from '../text';
import styles from './style.module.css';

const DEFAULT_TAG = <div />;

/**
 * Secondary content placed in the collapsible card header that describes
 * the trigger button via `aria-describedby`. Use it for supplementary
 * information such as status badges or summary values.
 *
 * Must be rendered inside `CollapsibleCard.Header`.
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
	{ children, className, id: idProp, render = DEFAULT_TAG, ...restProps },
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
		<Text
			ref={ ref }
			variant="body-md"
			render={ render }
			id={ descriptionId }
			aria-hidden="true"
			className={ clsx( styles[ 'header-description' ], className ) }
			{ ...restProps }
		>
			{ children }
		</Text>
	);
} );
