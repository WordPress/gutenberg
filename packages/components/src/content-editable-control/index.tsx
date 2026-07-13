/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { useBaseControlProps } from '../base-control/hooks';
import type { WordPressComponentProps } from '../context';
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
	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		className,
		help,
		hideLabelFromVision,
		label,
	} );

	return (
		<BaseControl { ...baseControlProps }>
			<div
				className={ styles.editable }
				role="textbox"
				aria-multiline
				aria-label={ label }
				aria-placeholder={ placeholder || undefined }
				aria-disabled={ disabled || undefined }
				aria-required={ required || undefined }
				ref={ forwardedRef }
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
