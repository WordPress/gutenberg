/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { useInstanceId, useRefEffect } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';
import { Icon, check, reset } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { HStack } from '../h-stack';
import type { CheckboxControlProps } from './types';
import type { WordPressComponentProps } from '../context';

/**
 * Checkboxes allow the user to select one or more items from a set.
 *
 * ```jsx
 * import { CheckboxControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyCheckboxControl = () => {
 *   const [ isChecked, setChecked ] = useState( true );
 *   return (
 *     <CheckboxControl
 *       label="Is author"
 *       help="Is the user a author or not?"
 *       checked={ isChecked }
 *       onChange={ setChecked }
 *     />
 *   );
 * };
 * ```
 */
export function CheckboxControl(
	props: WordPressComponentProps< CheckboxControlProps, 'input', false >
) {
	const {
		__nextHasNoMarginBottom,
		label,
		className,
		heading,
		checked,
		indeterminate,
		help,
		id: idProp,
		onChange,
		...additionalProps
	} = props;

	if ( heading ) {
		deprecated( '`heading` prop in `CheckboxControl`', {
			alternative: 'a separate element to implement a heading',
			since: '5.8',
		} );
	}

	const [ showCheckedIcon, setShowCheckedIcon ] = useState( false );
	const [ showIndeterminateIcon, setShowIndeterminateIcon ] =
		useState( false );

	// Run the following callback every time the `ref` (and the additional
	// dependencies) change.
	const ref = useRefEffect< HTMLInputElement >(
		( node ) => {
			if ( ! node ) {
				return;
			}

			// It cannot be set using an HTML attribute.
			node.indeterminate = !! indeterminate;

			setShowCheckedIcon( node.matches( ':checked' ) );
			setShowIndeterminateIcon( node.matches( ':indeterminate' ) );
		},
		[ checked, indeterminate ]
	);
	const id = useInstanceId(
		CheckboxControl,
		'inspector-checkbox-control',
		idProp
	);
	const onChangeValue = ( event: ChangeEvent< HTMLInputElement > ) =>
		onChange( event.target.checked );

	return (
		<BaseControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ heading }
			id={ id }
			help={
				help && (
					<span className="components-checkbox-control__help">
						{ help }
					</span>
				)
			}
			className={ clsx( 'components-checkbox-control', className ) }
		>
			<HStack spacing={ 0 } justify="start" alignment="top">
				<span className="components-checkbox-control__input-container">
					<input
						ref={ ref }
						id={ id }
						className="components-checkbox-control__input"
						type="checkbox"
						value="1"
						onChange={ onChangeValue }
						checked={ checked }
						aria-describedby={ !! help ? id + '__help' : undefined }
						{ ...additionalProps }
					/>
					{ showIndeterminateIcon ? (
						<Icon
							icon={ reset }
							className="components-checkbox-control__indeterminate"
							role="presentation"
						/>
					) : null }
					{ showCheckedIcon ? (
						<Icon
							icon={ check }
							className="components-checkbox-control__checked"
							role="presentation"
						/>
					) : null }
				</span>
				{ label && (
					<label
						className="components-checkbox-control__label"
						htmlFor={ id }
					>
						{ label }
					</label>
				) }
			</HStack>
		</BaseControl>
	);
}

export default CheckboxControl;
