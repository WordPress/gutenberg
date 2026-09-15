import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef, useId } from '@wordpress/element';
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton } from '../../../icon-button';
import { VisuallyHidden } from '../../../visually-hidden';
import type { ComboboxChipWithRemoveProps } from './types';
import styles from './style.module.css';

function mergeDescribedBy(
	...ids: Array< string | undefined >
): string | undefined {
	const merged = ids.filter( Boolean ).join( ' ' );
	return merged === '' ? undefined : merged;
}

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
		'aria-description': descriptionText = __(
			'Press Backspace or Delete to remove.'
		),
		'aria-describedby': ariaDescribedby,
		...restProps
	},
	ref
) {
	const hintId = useId();
	const hasDescription = descriptionText !== '';

	return (
		<>
			<_Combobox.Chip
				ref={ ref }
				className={ clsx( styles.chip, className ) }
				{ ...restProps }
				aria-describedby={ mergeDescribedBy(
					ariaDescribedby,
					hasDescription ? hintId : undefined
				) }
			>
				{ prefix && (
					<span className={ styles[ 'chip-prefix' ] }>
						{ prefix }
					</span>
				) }
				<span className={ styles[ 'chip-content' ] }>{ children }</span>

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
							aria-hidden={ disabled || undefined }
							{ ...props }
						/>
					) }
				/>
			</_Combobox.Chip>
			{ hasDescription && (
				<VisuallyHidden id={ hintId } render={ <span /> }>
					{ descriptionText }
				</VisuallyHidden>
			) }
		</>
	);
} );
