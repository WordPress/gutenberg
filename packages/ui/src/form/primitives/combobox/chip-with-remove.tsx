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
 */
export const ChipWithRemove = forwardRef<
	HTMLDivElement,
	ComboboxChipWithRemoveProps
>( function ChipWithRemove(
	{ className, children, prefix, removeLabel = __( 'Remove' ), ...restProps },
	ref
) {
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
	);
} );
