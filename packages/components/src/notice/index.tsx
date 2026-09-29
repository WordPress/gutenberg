import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import {
	RawHTML,
	useEffect,
	useState,
	renderToString,
} from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { closeSmall } from '@wordpress/icons';
import { Collapsible } from '@wordpress/ui';
import Button from '../button';
import type { NoticeAction, NoticeProps } from './types';
import type { DeprecatedButtonProps } from '../button/types';
import { VisuallyHidden } from '../visually-hidden';

const noop = () => {};

/**
 * Converts notice content to the plain text that is announced and copied.
 */
function toText( message: NoticeProps[ 'children' ] ) {
	return typeof message === 'string' ? message : renderToString( message );
}

/**
 * Discloses a fuller account of the notice, and offers it for copying.
 *
 * A failure is one of the moments where someone reaches for a search engine or
 * an assistant, and retyping a server's message by hand is where that stops
 * being worth doing. The panel keeps the full width of the notice, since a
 * server's account of a failure is the kind of text that reads badly in a
 * narrow column.
 */
function NoticeDetail( {
	detail,
	message,
	status,
	children,
}: {
	detail: string;
	message: string;
	status: NoticeProps[ 'status' ];
	children?: NoticeProps[ 'children' ];
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const isError = status === 'error';
	// The button reads as what it does and keeps that name: it holds focus once
	// clicked, and renaming the focused element is announced inconsistently, so
	// the copy is confirmed through the live region instead.
	const ref = useCopyToClipboard< HTMLButtonElement >(
		`${ message }\n\n${ detail }`,
		() =>
			speak(
				isError
					? __( 'Error copied to clipboard.' )
					: __( 'Notice copied to clipboard.' )
			)
	);

	return (
		<Collapsible.Root
			className="components-notice__detail"
			open={ isOpen }
			onOpenChange={ setIsOpen }
		>
			<div className="components-notice__actions">
				{ children }
				<Collapsible.Trigger
					render={ <Button size="compact" variant="secondary" /> }
				>
					{ isOpen ? __( 'Hide details' ) : __( 'Show details' ) }
				</Collapsible.Trigger>
				<Button
					size="compact"
					variant="secondary"
					className="components-notice__copy"
					ref={ ref }
				>
					{ isError ? __( 'Copy error' ) : __( 'Copy details' ) }
				</Button>
			</div>
			{ /* Kept in the document while collapsed, so that a browser's
			     find-in-page can still turn up what the notice disclosed. */ }
			<Collapsible.Panel hiddenUntilFound>
				<p className="components-notice__detail-message">{ detail }</p>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 */
function useSpokenMessage(
	message: NoticeProps[ 'spokenMessage' ],
	politeness: NoticeProps[ 'politeness' ]
) {
	const spokenMessage = toText( message );

	useEffect( () => {
		if ( spokenMessage ) {
			speak( spokenMessage, politeness );
		}
	}, [ spokenMessage, politeness ] );
}

function getDefaultPoliteness( status: NoticeProps[ 'status' ] ) {
	switch ( status ) {
		case 'success':
		case 'warning':
		case 'info':
			return 'polite';
		// The default will also catch the 'error' status.
		default:
			return 'assertive';
	}
}

function getStatusLabel( status: NoticeProps[ 'status' ] ) {
	switch ( status ) {
		case 'warning':
			return __( 'Warning notice' );
		case 'info':
			return __( 'Information notice' );
		case 'error':
			return __( 'Error notice' );
		// The default will also catch the 'success' status.
		default:
			return __( 'Notice' );
	}
}

/**
 * `Notice` is a component used to communicate feedback to the user.
 *
 *```jsx
 * import { Notice } from `@wordpress/components`;
 *
 * const MyNotice = () => (
 *   <Notice status="error">An unknown error occurred.</Notice>
 * );
 * ```
 */
function Notice( {
	className,
	status = 'info',
	children,
	spokenMessage = children,
	onRemove = noop,
	isDismissible = true,
	actions = [],
	politeness = getDefaultPoliteness( status ),
	detail,
	__unstableHTML,
	// onDismiss is a callback executed when the notice is dismissed.
	// It is distinct from onRemove, which _looks_ like a callback but is
	// actually the function to call to remove the notice from the UI.
	onDismiss = noop,
}: NoticeProps ) {
	useSpokenMessage( spokenMessage, politeness );

	// Dismissibility is not a wrapper modifier; target `.components-notice__dismiss`
	// or `.components-notice:has(.components-notice__dismiss)` from outside CSS.
	const classes = clsx( className, 'components-notice', 'is-' + status );

	if ( __unstableHTML && typeof children === 'string' ) {
		children = <RawHTML>{ children }</RawHTML>;
	}

	const onDismissNotice = () => {
		onDismiss();
		onRemove();
	};

	const actionButtons = actions.map(
		(
			{
				className: buttonCustomClasses,
				label,
				isPrimary,
				variant,
				noDefaultClasses = false,
				onClick,
				url,
				disabled,
			}: NoticeAction &
				// `isPrimary` is a legacy prop included for
				// backcompat, but `variant` should be used
				// instead.
				Pick< DeprecatedButtonProps, 'isPrimary' >,
			index
		) => {
			let computedVariant = variant;
			if ( variant !== 'primary' && ! noDefaultClasses ) {
				computedVariant = ! url ? 'secondary' : 'link';
			}
			if ( typeof computedVariant === 'undefined' && isPrimary ) {
				computedVariant = 'primary';
			}

			return (
				<Button
					size="compact"
					key={ index }
					href={ url }
					variant={ computedVariant }
					onClick={ onClick }
					disabled={ disabled }
					accessibleWhenDisabled
					className={ clsx(
						'components-notice__action',
						buttonCustomClasses
					) }
				>
					{ label }
				</Button>
			);
		}
	);

	return (
		<div className={ classes }>
			<VisuallyHidden>{ getStatusLabel( status ) }</VisuallyHidden>
			<div className="components-notice__content">{ children }</div>
			{ /* One actions row, whether or not there is a detail to disclose:
			     the disclosure and the copy button are actions like any other. */ }
			{ detail ? (
				<NoticeDetail
					detail={ detail }
					message={ toText( spokenMessage ) }
					status={ status }
				>
					{ actionButtons }
				</NoticeDetail>
			) : (
				actions.length > 0 && (
					<div className="components-notice__actions">
						{ actionButtons }
					</div>
				)
			) }
			{ isDismissible && (
				<Button
					size="small"
					className="components-notice__dismiss"
					icon={ closeSmall }
					label={ __( 'Close' ) }
					onClick={ onDismissNotice }
				/>
			) }
		</div>
	);
}

export default Notice;
