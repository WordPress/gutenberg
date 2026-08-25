import { Combobox as _Combobox } from '@base-ui/react/combobox';
import { forwardRef } from '@wordpress/element';
import clsx from 'clsx';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button } from '../../../button';
import { Icon } from '../../../icon';
import iconButtonStyles from '../../../icon-button/style.module.css';
import * as Tooltip from '../../../tooltip';
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
		removeLabel: removeLabelProp,
		removeAriaLabel: removeAriaLabelProp,
		'aria-label': ariaLabel,
		...restProps
	},
	ref
) {
	const chipAriaLabel =
		ariaLabel ?? ( typeof children === 'string' ? children : undefined );
	const removeLabel = removeLabelProp ?? __( 'Remove' );
	const removeAriaLabel =
		removeAriaLabelProp ??
		( typeof children === 'string'
			? sprintf(
					/* translators: %s: chip label. */
					__( 'Remove %s' ),
					children
			  )
			: __( 'Remove' ) );

	return (
		<_Combobox.Chip
			ref={ ref }
			className={ clsx( styles.chip, className ) }
			{ ...restProps }
			aria-label={ chipAriaLabel }
		>
			{ prefix && (
				<span className={ styles[ 'chip-prefix' ] }>{ prefix }</span>
			) }
			<span className={ styles[ 'chip-content' ] }>{ children }</span>

			<_Combobox.ChipRemove
				className={ styles[ 'chip-remove' ] }
				render={ (
					{ className: triggerClassName, ...triggerProps },
					{ disabled }
				) => (
					<Tooltip.Root>
						<Tooltip.Trigger
							{ ...triggerProps }
							disabled={ disabled }
							render={
								<Button
									size="small"
									variant="minimal"
									tone="neutral"
									aria-label={ removeAriaLabel }
									disabled={ disabled }
									focusableWhenDisabled={ false }
									aria-hidden={ disabled || undefined }
								/>
							}
							className={ clsx(
								iconButtonStyles[ 'icon-button' ],
								triggerClassName
							) }
						>
							<Icon
								icon={ closeSmall }
								size={ 24 }
								className={ iconButtonStyles.icon }
							/>
						</Tooltip.Trigger>
						<Tooltip.Popup>{ removeLabel }</Tooltip.Popup>
					</Tooltip.Root>
				) }
			/>
		</_Combobox.Chip>
	);
} );
