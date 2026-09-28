import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef, useId } from '@wordpress/element';
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton } from '../../../icon-button';
import { VisuallyHidden } from '../../../visually-hidden';
import type { ComboboxChipWithRemoveProps } from './types';
import styles from './style.module.css';

/**
 * A utility component that combines a chip and a remove button,
 * with standard styling.
 */
export const ChipWithRemove = forwardRef<
	HTMLDivElement,
	ComboboxChipWithRemoveProps
>( function ChipWithRemove(
	{
		className,
		children,
		prefix,
		removeLabel = __( 'Remove' ),
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	const labelId = useId();
	const hintId = useId();
	const chipNameFrom = ariaLabelledby || labelId;
	const nameFromAriaLabel = Boolean( ariaLabel && ! ariaLabelledby );

	return (
		<_Combobox.Chip
			ref={ ref }
			className={ clsx( styles.chip, className ) }
			{ ...restProps }
			aria-labelledby={ chipNameFrom }
			aria-describedby={ clsx( ariaDescribedby, hintId ) || undefined }
		>
			{ prefix && (
				<span
					className={ styles[ 'chip-prefix' ] }
					aria-hidden={ nameFromAriaLabel ? true : undefined }
				>
					{ prefix }
				</span>
			) }
			{ nameFromAriaLabel && (
				<VisuallyHidden id={ labelId } aria-hidden="true">
					{ ariaLabel }
				</VisuallyHidden>
			) }
			<span
				id={ nameFromAriaLabel ? undefined : labelId }
				className={ styles[ 'chip-content' ] }
				aria-hidden={ nameFromAriaLabel ? true : undefined }
			>
				{ children }
			</span>
			<VisuallyHidden id={ hintId } aria-hidden="true">
				{ __( 'Press Backspace or Delete to remove.' ) }
			</VisuallyHidden>
			<_Combobox.ChipRemove
				className={ styles[ 'chip-remove' ] }
				render={ ( props, { disabled } ) => (
					<IconButton
						icon={ closeSmall }
						label={ removeLabel }
						size="small"
						variant="minimal"
						tone="neutral"
						focusableWhenDisabled={ false }
						disabled={ disabled }
						{ ...props }
						aria-describedby={
							clsx( props[ 'aria-describedby' ], chipNameFrom ) ||
							undefined
						}
					/>
				) }
			/>
		</_Combobox.Chip>
	);
} );
