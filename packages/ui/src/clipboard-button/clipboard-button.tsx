import clsx from 'clsx';
import { speak } from '@wordpress/a11y';
import { useEvent } from '@wordpress/compose';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '../button';
import { getClipboardStatusIcon } from '../clipboard-icon/clipboard-icon';
import { ClipboardIcon } from '../clipboard-icon';
import {
	CopyToClipboard,
	DEFAULT_TIMEOUT,
} from '../copy-to-clipboard/copy-to-clipboard';
import { Icon } from '../icon';
import * as Tooltip from '../tooltip';
import styles from './style.module.css';
import type { ClipboardButtonProps } from './types';
import type { CopyToClipboardStatus } from '../copy-to-clipboard/types';

type ClipboardButtonComponentProps = Omit<
	ClipboardButtonProps,
	'text' | 'timeout' | 'onCopy'
> & {
	status: CopyToClipboardStatus;
};

function ClipboardButtonGraphic( {
	status,
	icon,
	isIconOnly,
}: {
	status: CopyToClipboardStatus;
	icon?: ClipboardButtonProps[ 'icon' ];
	isIconOnly: boolean;
} ) {
	const className = isIconOnly ? styles[ 'icon-only-icon' ] : styles.icon;

	if ( isIconOnly ) {
		if ( icon ) {
			return <Icon icon={ icon } size={ 24 } className={ className } />;
		}

		return <ClipboardIcon status={ status } className={ className } />;
	}

	return (
		<Button.Icon
			icon={ icon ?? getClipboardStatusIcon( status ) }
			className={ className }
		/>
	);
}

const ClipboardButtonComponent = forwardRef<
	HTMLButtonElement,
	ClipboardButtonComponentProps
>( function ClipboardButtonComponent(
	{
		status,
		className,
		disabled,
		focusableWhenDisabled = true,
		hasTooltip = true,
		tooltipInitialText = __( 'Copy' ),
		tooltipSuccessText = __( 'Copied!' ),
		icon,
		iconPosition = 'start',
		positioner,
		children,
		variant = 'minimal',
		tone = 'neutral',
		onMouseEnter,
		onFocus,
		'aria-label': ariaLabel,
		...restProps
	},
	ref
) {
	const isIconOnly =
		children === undefined || children === null || children === false;
	const tooltipLabel =
		status === 'success' ? tooltipSuccessText : tooltipInitialText;
	const classes = clsx( isIconOnly && styles[ 'icon-only' ], className );
	const graphic = (
		<ClipboardButtonGraphic
			status={ status }
			icon={ icon }
			isIconOnly={ isIconOnly }
		/>
	);

	return (
		<Tooltip.Root
			disabled={
				! hasTooltip ||
				( Boolean( disabled ) && ! focusableWhenDisabled )
			}
		>
			<Tooltip.Trigger
				ref={ ref }
				disabled={ disabled && ! focusableWhenDisabled }
				onMouseEnter={ onMouseEnter }
				onFocus={ onFocus }
				render={
					<Button
						{ ...restProps }
						variant={ variant }
						tone={ tone }
						aria-label={
							ariaLabel ??
							( isIconOnly ? tooltipInitialText : undefined )
						}
						disabled={ disabled }
						focusableWhenDisabled={ focusableWhenDisabled }
					/>
				}
				className={ classes }
			>
				{ iconPosition === 'start' ? graphic : null }
				{ children }
				{ iconPosition === 'end' ? graphic : null }
			</Tooltip.Trigger>
			<Tooltip.Popup positioner={ positioner }>
				{ tooltipLabel }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
} );

/**
 * A button that copies text to the clipboard and confirms the action with a
 * status icon and tooltip. Inherits `Button` props.
 *
 * When rendering a group of `ClipboardButton`s, wrap them in a
 * `Tooltip.Provider` to coordinate tooltip delays across the group.
 *
 * ```jsx
 * import { ClipboardButton } from '@wordpress/ui';
 *
 * function MyClipboardButton() {
 * 	return <ClipboardButton text="Text to copy" />;
 * }
 * ```
 */
export const ClipboardButton = forwardRef<
	HTMLButtonElement,
	ClipboardButtonProps
>( function ClipboardButton(
	{
		text,
		timeout = DEFAULT_TIMEOUT,
		onCopy,
		hasTooltip = true,
		onMouseEnter,
		onFocus,
		...buttonProps
	},
	ref
) {
	const timeoutIdRef = useRef< ReturnType< typeof setTimeout > >( undefined );
	const [ tooltipDisabled, setTooltipDisabled ] = useState( false );

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current !== undefined ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	const handleCopy = useEvent( ( copiedText: string, result: boolean ) => {
		onCopy?.( copiedText, result );
		if ( result ) {
			speak( buttonProps.tooltipSuccessText ?? __( 'Copied!' ) );
		}
		setTooltipDisabled( false );

		if ( timeoutIdRef.current !== undefined ) {
			clearTimeout( timeoutIdRef.current );
		}

		timeoutIdRef.current = setTimeout( () => {
			setTooltipDisabled( true );
		}, timeout );
	} );

	const resetTooltip = useEvent( () => {
		if ( tooltipDisabled ) {
			setTooltipDisabled( false );
		}
	} );

	const handleMouseEnter: ClipboardButtonProps[ 'onMouseEnter' ] = useEvent(
		( event ) => {
			onMouseEnter?.( event );
			resetTooltip();
		}
	);

	const handleFocus: ClipboardButtonProps[ 'onFocus' ] = useEvent(
		( event ) => {
			onFocus?.( event );
			resetTooltip();
		}
	);

	return (
		<CopyToClipboard
			text={ text }
			timeout={ timeout }
			onCopy={ handleCopy }
		>
			{ ( status ) => (
				<ClipboardButtonComponent
					ref={ ref }
					{ ...buttonProps }
					status={ status }
					hasTooltip={ hasTooltip && ! tooltipDisabled }
					onMouseEnter={ handleMouseEnter }
					onFocus={ handleFocus }
				/>
			) }
		</CopyToClipboard>
	);
} );
