/**
 * External dependencies
 */
import clsx from 'clsx';
import type { FocusEvent, ForwardedRef } from 'react';

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
import { useControlledValue } from '../utils/hooks';
import type { RichTextControlProps } from './types';

/**
 * A presentational rich text control: a labeled `contentEditable` form field
 * with a selection ("active") state that gates its `children`.
 *
 * Unlike the in-canvas `RichText` from `@wordpress/block-editor`, this control
 * is intended for standalone form fields (DataForms, sidebar inputs, etc.).
 * It is deliberately **presentational only** and has no `@wordpress/rich-text`
 * dependency: the editable behavior (value, formatting, keyboard shortcuts) is
 * injected by the consumer through the forwarded ref and `children`. The
 * consumer owns the `useRichText` wiring; this component owns the chrome
 * (`BaseControl` + label and the editable element).
 *
 * The selection state can be controlled through the `isSelected` prop or left
 * uncontrolled; either way `children` are mounted only while the field is
 * selected. Uncontrolled, the state follows the editable's focus and blur
 * directly. A consumer whose format UI opens popovers must control
 * `isSelected` and implement its own blur handling, since only the consumer
 * can tell whether the element receiving focus belongs to one of its popovers
 * (see the richtext DataForm control in `@wordpress/dataviews` for the
 * canonical assembly).
 *
 * @example
 * ```jsx
 * // The rich-text "assembly" lives in the consumer.
 * <RichTextControl
 *     label="Caption"
 *     ref={ mergedRef }
 *     isSelected={ isSelected }
 *     onFocus={ onEditableFocus }
 *     onBlur={ onEditableBlur }
 * >
 *     <KeyboardShortcutContext.Provider value={ shortcuts }>
 *         <FormatEdit … />
 *     </KeyboardShortcutContext.Provider>
 * </RichTextControl>
 * ```
 */
function UnforwardedRichTextControl(
	{
		label,
		isSelected: isSelectedProp,
		defaultIsSelected,
		onSelectedChange,
		children,
		id,
		className,
		help,
		hideLabelFromVision,
		disabled,
		required,
		disableLineBreaks,
		onFocus,
		onBlur,
		...additionalProps
	}: WordPressComponentProps< RichTextControlProps, 'div', false >,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	// Selection ("active") state, usable both controlled (`isSelected`) and
	// uncontrolled (`defaultIsSelected` + internal state). Either way,
	// `onSelectedChange` reports the focus/blur transitions the control
	// derives below.
	const [ isSelected = false, setIsSelected ] = useControlledValue( {
		value: isSelectedProp,
		defaultValue: defaultIsSelected,
		onChange: onSelectedChange,
	} );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		help,
		hideLabelFromVision,
		label,
	} );

	return (
		<>
			{ isSelected && ! disabled && children }
			<BaseControl { ...baseControlProps }>
				<div
					className={ clsx( 'wp-rich-text-control', className, {
						'is-disabled': disabled,
					} ) }
					role="textbox"
					aria-multiline={ ! disableLineBreaks }
					aria-label={ label }
					aria-disabled={ disabled || undefined }
					aria-required={ required || undefined }
					ref={ forwardedRef }
					onFocus={ ( event: FocusEvent< HTMLDivElement > ) => {
						onFocus?.( event );
						setIsSelected?.( true );
					} }
					onBlur={ ( event: FocusEvent< HTMLDivElement > ) => {
						onBlur?.( event );
						setIsSelected?.( false );
					} }
					// A disabled field is not `contentEditable`, which also
					// removes it from the tab order.
					contentEditable={ ! disabled }
					suppressContentEditableWarning
					{ ...additionalProps }
					{ ...controlProps }
				/>
			</BaseControl>
		</>
	);
}

export const RichTextControl = forwardRef( UnforwardedRichTextControl );

export default RichTextControl;
