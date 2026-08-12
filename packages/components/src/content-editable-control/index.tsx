import type { ForwardedRef } from 'react';
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import BaseControl from '../base-control';
import { useBaseControlProps } from '../base-control/hooks';
import type { WordPressComponentProps } from '../context';
import { VisuallyHidden } from '../visually-hidden';
import type { ContentEditableControlProps } from './types';
import styles from './style.module.scss';

function UnforwardedContentEditableControl(
	{
		label,
		id,
		className,
		help,
		hideLabelFromVision,
		disabled,
		required,
		placeholder,
		...additionalProps
	}: WordPressComponentProps< ContentEditableControlProps, 'div', false >,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	// The label is not passed through to `BaseControl`: it would render a
	// `<label for>` pointing at the `contentEditable` `div`, which is not a
	// labelable element, making the association invalid. The label is instead
	// rendered here without `for` and wired up via `aria-labelledby`.
	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		className,
		help,
	} );

	const labelId = `${ controlProps.id }__label`;
	const editableRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ editableRef, forwardedRef ] );

	return (
		<BaseControl { ...baseControlProps }>
			{ hideLabelFromVision ? (
				<VisuallyHidden id={ labelId }>{ label }</VisuallyHidden>
			) : (
				<BaseControl.VisualLabel
					id={ labelId }
					// Focus the field on label click, like `<label for>` would.
					onClick={ () => editableRef.current?.focus() }
				>
					{ label }
				</BaseControl.VisualLabel>
			) }
			<div
				className={ styles.editable }
				role="textbox"
				aria-multiline
				aria-labelledby={ labelId }
				aria-placeholder={ placeholder || undefined }
				aria-disabled={ disabled || undefined }
				aria-required={ required || undefined }
				ref={ mergedRefs }
				// A disabled field is not `contentEditable`, which also
				// removes it from the tab order.
				contentEditable={ ! disabled }
				suppressContentEditableWarning
				{ ...additionalProps }
				{ ...controlProps }
			/>
		</BaseControl>
	);
}

/**
 * A presentational `contentEditable` form control: a labeled editable element
 * rendered with the chrome (`BaseControl` + label) shared by the other form
 * controls in the package.
 *
 * Unlike the in-canvas `RichText` from `@wordpress/block-editor`, this control
 * is intended for standalone form fields (DataForms, sidebar inputs, etc.).
 * It is deliberately **presentational only** and has no `@wordpress/rich-text`
 * dependency: the editable behavior (value, formatting, keyboard shortcuts)
 * and any focus/selection tracking are owned by the consumer, which wires them
 * through the forwarded ref and native event props (see the richtext DataForm
 * control in `@wordpress/dataviews` for the canonical assembly).
 *
 * ```jsx
 * // The rich-text "assembly" lives in the consumer.
 * <ContentEditableControl
 *     label="Caption"
 *     ref={ mergedRef }
 *     onFocus={ onEditableFocus }
 *     onBlur={ onEditableBlur }
 * />
 * ```
 */
export const ContentEditableControl = forwardRef(
	UnforwardedContentEditableControl
);

export default ContentEditableControl;
