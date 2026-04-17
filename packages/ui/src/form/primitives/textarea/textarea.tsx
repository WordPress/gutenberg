import { mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { cloneElement, forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { TextareaProps } from './types';
import { Input } from '../input';
import defenseStyles from '../../../utils/css/global-css-defense.module.css';

const wrappedRender = (
	render: NonNullable< TextareaProps[ 'render' ] >,
	restProps: TextareaProps & { ref: React.Ref< HTMLTextAreaElement > }
) => {
	return function textareaRender(
		props: React.HTMLAttributes< HTMLTextAreaElement >
	) {
		return typeof render === 'function'
			? render( mergeProps( props, restProps ) )
			: cloneElement( render, mergeProps( props, restProps ) );
	};
};

export const Textarea = forwardRef< HTMLTextAreaElement, TextareaProps >(
	function Textarea(
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
				className={ clsx( styles.wrapper, className ) }
				style={ style }
				render={ wrappedRender(
					render || ( ( props ) => <textarea { ...props } /> ),
					{
						className: clsx(
							defenseStyles.textarea,
							styles.textarea
						),
						ref,
						rows,
						...restProps,
					}
				) }
				value={ value }
				defaultValue={ defaultValue }
				onValueChange={ onValueChange }
				disabled={ disabled }
			/>
		);
	}
);
