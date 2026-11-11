import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import { Circle, Path, SVG } from '@wordpress/primitives';
import type { FormToggleProps } from './types';
import type { WordPressComponentProps } from '../context';

export const noop = () => {};

const onLabel = (
	<SVG
		className="components-form-toggle__label components-form-toggle__on-label"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 8 8"
	>
		<Path
			d="M4 1.5v5"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
		/>
	</SVG>
);

const offLabel = (
	<SVG
		className="components-form-toggle__label components-form-toggle__off-label"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 8 8"
	>
		<Circle cx={ 4 } cy={ 4 } r={ 2.5 } fill="none" stroke="currentColor" />
	</SVG>
);

function UnforwardedFormToggle(
	props: WordPressComponentProps< FormToggleProps, 'input', false >,
	ref: ForwardedRef< HTMLInputElement >
) {
	const {
		className,
		checked,
		id,
		disabled,
		onChange = noop,
		onClick,
		...additionalProps
	} = props;
	const wrapperClasses = clsx( 'components-form-toggle', className, {
		'is-checked': checked,
		'is-disabled': disabled,
	} );

	return (
		<span className={ wrapperClasses }>
			<input
				className="components-form-toggle__input"
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ onChange }
				disabled={ disabled }
				onClick={ ( event ) => {
					// Compat code for Safari to ensure that the toggle is focused when clicked.
					event.currentTarget.focus();

					onClick?.( event );
				} }
				{ ...additionalProps }
				ref={ ref }
			/>
			<span className="components-form-toggle__track"></span>
			{ onLabel }
			{ offLabel }
			<span className="components-form-toggle__thumb"></span>
		</span>
	);
}

/**
 * FormToggle switches a single setting on or off.
 *
 * ```jsx
 * import { FormToggle } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyFormToggle = () => {
 *   const [ isChecked, setChecked ] = useState( true );
 *
 *   return (
 *     <FormToggle
 *       checked={ isChecked }
 *       onChange={ () => setChecked( ( state ) => ! state ) }
 *     />
 *   );
 * };
 * ```
 */
export const FormToggle = forwardRef( UnforwardedFormToggle );
FormToggle.displayName = 'FormToggle';

export default FormToggle;
