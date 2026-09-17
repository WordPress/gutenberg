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
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	const labelId = useId();
	const hintId = useId();
	const chipAriaLabel =
		ariaLabel ?? ( typeof children === 'string' ? children : undefined );

	return (
		<_Combobox.Chip
			ref={ ref }
			className={ clsx( styles.chip, className ) }
			{ ...restProps }
			aria-label={ chipAriaLabel }
			aria-describedby={ clsx( ariaDescribedby, hintId ) || undefined }
		>
			{ prefix && (
				<span className={ styles[ 'chip-prefix' ] }>{ prefix }</span>
			) }
			<span id={ labelId } className={ styles[ 'chip-content' ] }>
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
							clsx( props[ 'aria-describedby' ], labelId ) ||
							undefined
						}
						aria-hidden={ disabled || undefined }
					/>
				) }
			/>
		</_Combobox.Chip>
	);
} );
