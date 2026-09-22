import clsx from 'clsx';
import type {
	ElementType,
	ForwardedRef,
	ReactElement,
	ReactNode,
	ComponentProps,
} from 'react';
import { forwardRef } from '@wordpress/element';
import type { WordPressComponentProps } from '../../context';
import { PolymorphicElement } from '../../utils/polymorphic-element';
import styles from './style.module.scss';

type StyledElementProps< T extends ElementType > = WordPressComponentProps<
	{ children?: ReactNode },
	T
>;

function UnforwardedWrapper< T extends ElementType = 'div' >(
	{ className, ...props }: StyledElementProps< T >,
	ref: ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			ref={ ref }
			{ ...props }
			className={ clsx( styles.wrapper, className ) }
		/>
	);
}

function UnforwardedStyledField< T extends ElementType = 'div' >(
	{ className, ...props }: StyledElementProps< T >,
	ref: ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			ref={ ref }
			{ ...props }
			className={ clsx( styles.field, className ) }
		/>
	);
}

function UnforwardedStyledLabel< T extends ElementType = 'label' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: ForwardedRef< any >
) {
	return (
		<PolymorphicElement< T >
			as={ ( as ?? 'label' ) as T }
			ref={ ref }
			{ ...( props as ComponentProps< T > ) }
			className={ clsx( styles.label, className ) }
		/>
	);
}

function UnforwardedStyledHelp< T extends ElementType = 'p' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: ForwardedRef< any >
) {
	return (
		<PolymorphicElement< T >
			as={ ( as ?? 'p' ) as T }
			ref={ ref }
			{ ...( props as ComponentProps< T > ) }
			className={ clsx( styles.help, className ) }
		/>
	);
}

function UnforwardedStyledVisualLabel< T extends ElementType = 'span' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: ForwardedRef< any >
) {
	return (
		<PolymorphicElement< T >
			as={ ( as ?? 'span' ) as T }
			ref={ ref }
			{ ...( props as ComponentProps< T > ) }
			className={ clsx( styles.label, className ) }
		/>
	);
}

export const Wrapper = forwardRef( UnforwardedWrapper ) as <
	T extends ElementType = 'div',
>(
	props: StyledElementProps< T > & { ref?: ForwardedRef< any > }
) => ReactElement | null;

export const StyledField = forwardRef( UnforwardedStyledField ) as <
	T extends ElementType = 'div',
>(
	props: StyledElementProps< T > & { ref?: ForwardedRef< any > }
) => ReactElement | null;

export const StyledLabel = forwardRef( UnforwardedStyledLabel ) as <
	T extends ElementType = 'label',
>(
	props: StyledElementProps< T > & { ref?: ForwardedRef< any > }
) => ReactElement | null;

export const StyledHelp = forwardRef( UnforwardedStyledHelp ) as <
	T extends ElementType = 'p',
>(
	props: StyledElementProps< T > & { ref?: ForwardedRef< any > }
) => ReactElement | null;

export const StyledVisualLabel = forwardRef( UnforwardedStyledVisualLabel ) as <
	T extends ElementType = 'span',
>(
	props: StyledElementProps< T > & { ref?: ForwardedRef< any > }
) => ReactElement | null;
