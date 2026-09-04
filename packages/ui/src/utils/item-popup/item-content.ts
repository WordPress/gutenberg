import {
	Children,
	cloneElement,
	isValidElement,
	useId,
} from '@wordpress/element';
import type { ElementType, ReactElement, ReactNode } from 'react';

export type ItemContentComponents = {
	Label: ElementType;
	Description: ElementType;
	validationMessage: string;
};

export type ItemAriaProps = {
	'aria-describedby'?: string;
	'aria-label'?: string;
	'aria-labelledby'?: string;
};

const VALIDATION_ENABLED = process.env.NODE_ENV !== 'production';

export function parseItemContent(
	children: ReactNode,
	{ Label, Description, validationMessage }: ItemContentComponents
) {
	const childArray = Children.toArray( children );
	const [ label, ...descriptions ] = childArray;
	const hasLabel =
		isValidElement< { id?: string } >( label ) && label.type === Label;
	const descriptionElements = descriptions.filter(
		( description ): description is ReactElement< { id?: string } > =>
			isValidElement< { id?: string } >( description ) &&
			description.type === Description
	);

	if (
		VALIDATION_ENABLED &&
		( ! hasLabel || descriptionElements.length !== descriptions.length )
	) {
		throw new Error( validationMessage );
	}

	return {
		descriptionIds: descriptionElements.map(
			( description ) => description.props.id
		),
		hasLabel,
		labelId: hasLabel ? label.props.id : undefined,
	};
}

export function useItemContent(
	children: ReactNode,
	components: ItemContentComponents,
	{
		'aria-describedby': ariaDescribedBy,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
	}: ItemAriaProps = {}
) {
	const generatedLabelId = useId();
	const generatedDescriptionId = useId();
	const { descriptionIds, hasLabel, labelId } = parseItemContent(
		children,
		components
	);
	const resolvedLabelId = hasLabel ? labelId ?? generatedLabelId : undefined;
	const resolvedDescriptionIds = descriptionIds.map(
		( descriptionId, index ) =>
			descriptionId ?? `${ generatedDescriptionId }-${ index }`
	);
	const itemDescribedBy = Array.from(
		new Set( [
			...( ariaDescribedBy?.split( /\s+/ ).filter( Boolean ) ?? [] ),
			...resolvedDescriptionIds,
		] )
	).join( ' ' );
	let descriptionIndex = 0;
	const { Label, Description } = components;
	const contentChildren = Children.map( children, ( child ) => {
		if ( ! isValidElement< { id?: string } >( child ) ) {
			return child;
		}

		if ( child.type === Label ) {
			return child.props.id === resolvedLabelId
				? child
				: cloneElement( child, { id: resolvedLabelId } );
		}

		if ( child.type !== Description ) {
			return child;
		}

		const descriptionId = resolvedDescriptionIds[ descriptionIndex++ ];
		return child.props.id === descriptionId
			? child
			: cloneElement( child, { id: descriptionId } );
	} );
	/*
	 * `aria-labelledby` takes precedence over `aria-label` in the accessible
	 * name algorithm. Only provide our generated label relationship when the
	 * consumer has not supplied either explicit naming prop, so explicit naming
	 * stays fully consumer-controlled.
	 */
	const labelledBy =
		ariaLabelledBy ?? ( ariaLabel ? undefined : resolvedLabelId );

	return {
		contentChildren,
		resolvedLabelId,
		itemAriaProps: {
			'aria-describedby': itemDescribedBy || undefined,
			'aria-label': ariaLabel,
			'aria-labelledby': labelledBy,
		},
	};
}
