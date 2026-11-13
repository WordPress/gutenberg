import { useRender } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { TextareaProps } from './types';
import { Input } from '../input';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';

const TextareaElement = forwardRef< HTMLTextAreaElement, TextareaProps >(
	function UnforwardedTextareaElement( { render, ...props }, ref ) {
		return useRender( {
			render,
			defaultTagName: 'textarea',
			ref,
			props,
		} );
	}
);

/**
 * A low-level primitive for a textarea field.
 *
 * Prefer `TextareaControl` when using with a standard label and description.
 */
export const Textarea = forwardRef< HTMLTextAreaElement, TextareaProps >(
	function UnforwardedTextarea(
		{
			className,
			defaultValue,
			disabled,
			onValueChange,
			render,
			rows = 4,
			style,
			value,
			...restProps
		},
		ref
	) {
		return (
			<Input
				ref={ ref }
				className={ clsx( styles.wrapper, className ) }
				style={ style }
				render={
					<TextareaElement
						className={ clsx(
							defenseStyles.textarea,
							styles.textarea
						) }
						rows={ rows }
						{ ...restProps }
						render={ render }
					/>
				}
				value={ value }
				defaultValue={ defaultValue }
				onValueChange={ onValueChange }
				disabled={ disabled }
			/>
		);
	}
);
