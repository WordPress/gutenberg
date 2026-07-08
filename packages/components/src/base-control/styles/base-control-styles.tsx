/**
 * External dependencies
 */
import clsx from 'clsx';
import type * as React from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { PolymorphicElement } from '../../utils/polymorphic-element';
import styles from './style.module.scss';

type StyledElementProps< T extends React.ElementType > =
	WordPressComponentProps< { children?: React.ReactNode }, T >;

function UnforwardedWrapper< T extends React.ElementType = 'div' >(
	{ className, ...props }: StyledElementProps< T >,
	ref: React.ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.wrapper,
				'components-base-control',
				className
			) }
		/>
	);
}

function UnforwardedStyledField< T extends React.ElementType = 'div' >(
	{ className, ...props }: StyledElementProps< T >,
	ref: React.ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.field,
				'components-base-control__field',
				className
			) }
		/>
	);
}

function UnforwardedStyledLabel< T extends React.ElementType = 'label' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: React.ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			as={ as ?? 'label' }
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.label,
				'components-base-control__label',
				className
			) }
		/>
	);
}

function UnforwardedStyledHelp< T extends React.ElementType = 'p' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: React.ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			as={ as ?? 'p' }
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.help,
				'components-base-control__help',
				className
			) }
		/>
	);
}

function UnforwardedStyledVisualLabel< T extends React.ElementType = 'span' >(
	{ as, className, ...props }: StyledElementProps< T >,
	ref: React.ForwardedRef< any >
) {
	return (
		<PolymorphicElement
			as={ as ?? 'span' }
			ref={ ref }
			{ ...props }
			className={ clsx(
				styles.label,
				'components-base-control__label',
				className
			) }
		/>
	);
}

export const Wrapper = forwardRef( UnforwardedWrapper ) as <
	T extends React.ElementType = 'div',
>(
	props: StyledElementProps< T > & { ref?: React.ForwardedRef< any > }
) => React.ReactElement | null;

export const StyledField = forwardRef( UnforwardedStyledField ) as <
	T extends React.ElementType = 'div',
>(
	props: StyledElementProps< T > & { ref?: React.ForwardedRef< any > }
) => React.ReactElement | null;

export const StyledLabel = forwardRef( UnforwardedStyledLabel ) as <
	T extends React.ElementType = 'label',
>(
	props: StyledElementProps< T > & { ref?: React.ForwardedRef< any > }
) => React.ReactElement | null;

export const StyledHelp = forwardRef( UnforwardedStyledHelp ) as <
	T extends React.ElementType = 'p',
>(
	props: StyledElementProps< T > & { ref?: React.ForwardedRef< any > }
) => React.ReactElement | null;

export const StyledVisualLabel = forwardRef( UnforwardedStyledVisualLabel ) as <
	T extends React.ElementType = 'span',
>(
	props: StyledElementProps< T > & { ref?: React.ForwardedRef< any > }
) => React.ReactElement | null;
