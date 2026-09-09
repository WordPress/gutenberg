import clsx from 'clsx';
import { speak } from '@wordpress/a11y';
import { useCopyToClipboard, useEvent, useMergeRefs } from '@wordpress/compose';
import {
	Children,
	forwardRef,
	isValidElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '../button';
import * as Tooltip from '../tooltip';
import { ClipboardButtonContext } from './context';
import { ClipboardButtonIcon } from './icon';
import styles from './style.module.css';
import type { ClipboardButtonProps, ClipboardButtonStatus } from './types';

const DEFAULT_TIMEOUT = 1000;
const INITIAL_STATUS: ClipboardButtonStatus = 'pending';

function isIconOnlyChildren( children: ClipboardButtonProps[ 'children' ] ) {
	if ( children === undefined ) {
		return true;
	}

	const items = Children.toArray( children );
	return (
		items.length === 1 &&
		isValidElement( items[ 0 ] ) &&
		items[ 0 ].type === ClipboardButtonIcon
	);
}

/**
 * A button that copies text to the clipboard. Inherits `Button` props, including
 * `tone` and `variant`. Compose `ClipboardButton.Icon`, text, or both as
 * children.
 *
 * When rendering a group of `ClipboardButton`s, wrap them in a
 * `Tooltip.Provider` to coordinate tooltip delays across the group.
 *
 * ```jsx
 * import { ClipboardButton } from '@wordpress/ui';
 *
 * function MyClipboardButton() {
 * 	return (
 * 		<ClipboardButton text="Text to copy">
 * 			<ClipboardButton.Icon />
 * 			Copy
 * 		</ClipboardButton>
 * 	);
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
		tooltipInitialText = __( 'Copy' ),
		tooltipSuccessText = __( 'Copied!' ),
		positioner,
		className,
		disabled,
		focusableWhenDisabled = true,
		onMouseEnter,
		onFocus,
		children,
		'aria-label': ariaLabel,
		...restProps
	},
	ref
) {
	const [ status, setStatus ] =
		useState< ClipboardButtonStatus >( INITIAL_STATUS );
	const timeoutIdRef = useRef< ReturnType< typeof setTimeout > >( undefined );
	const [ tooltipDisabled, setTooltipDisabled ] = useState( false );
	const isIconOnly = isIconOnlyChildren( children );
	const resolvedChildren =
		children === undefined ? <ClipboardButtonIcon /> : children;
	const tooltipLabel =
		status === 'success' ? tooltipSuccessText : tooltipInitialText;

	useEffect( () => {
		return () => {
			if ( timeoutIdRef.current !== undefined ) {
				clearTimeout( timeoutIdRef.current );
			}
		};
	}, [] );

	const onSuccess = useEvent( () => {
		const copiedText = typeof text === 'function' ? text() : text || '';
		setStatus( 'success' );
		onCopy?.( copiedText, true );
		speak( tooltipSuccessText );
		setTooltipDisabled( false );

		if ( timeoutIdRef.current !== undefined ) {
			clearTimeout( timeoutIdRef.current );
		}

		timeoutIdRef.current = setTimeout( () => {
			setStatus( INITIAL_STATUS );
			setTooltipDisabled( true );
		}, timeout );
	} );

	const copyRef = useCopyToClipboard( text, onSuccess );
	const mergedRef = useMergeRefs( [ ref, copyRef ] );

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
		<ClipboardButtonContext.Provider value={ { status, isIconOnly } }>
			<Tooltip.Root
				disabled={
					! hasTooltip ||
					tooltipDisabled ||
					( Boolean( disabled ) && ! focusableWhenDisabled )
				}
			>
				<Tooltip.Trigger
					ref={ mergedRef }
					disabled={ disabled && ! focusableWhenDisabled }
					onMouseEnter={ handleMouseEnter }
					onFocus={ handleFocus }
					render={
						<Button
							{ ...restProps }
							aria-label={
								ariaLabel ??
								( isIconOnly ? tooltipInitialText : undefined )
							}
							disabled={ disabled }
							focusableWhenDisabled={ focusableWhenDisabled }
						/>
					}
					className={ clsx(
						isIconOnly && styles[ 'icon-only' ],
						className
					) }
				>
					{ resolvedChildren }
				</Tooltip.Trigger>
				<Tooltip.Popup positioner={ positioner }>
					{ tooltipLabel }
				</Tooltip.Popup>
			</Tooltip.Root>
		</ClipboardButtonContext.Provider>
	);
} );
