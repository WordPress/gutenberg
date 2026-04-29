import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { IconButton } from '../../../icon-button';
import type { ComboboxChipWithRemoveProps } from './types';
import styles from './style.module.css';

/**
 * A utility component that combines a chip and a remove button,
 * with standard styling.
 *
 * For custom designs, use the `Combobox.Chip` and `Combobox.ChipRemove`
 * components directly.
 */
export const ChipWithRemove = forwardRef<
	HTMLDivElement,
	ComboboxChipWithRemoveProps
>( function Clear( { className, children, prefix, ...restProps }, ref ) {
	return (
		<_Combobox.Chip
			ref={ ref }
			className={ clsx( styles.chip, className ) }
			{ ...restProps }
		>
			{ prefix && (
				<span className={ styles[ 'chip-prefix' ] }>{ prefix }</span>
			) }
			<span className={ styles[ 'chip-content' ] }>{ children }</span>

			<_Combobox.ChipRemove
				className={ styles[ 'chip-remove' ] }
				render={ ( props, { disabled } ) => (
					<IconButton
						icon={ closeSmall }
						label={ __( 'Remove' ) }
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
	);
} );
