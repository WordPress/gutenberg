import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { RawHTML, useEffect, useRef } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { closeSmall } from '@wordpress/icons';
import Button from '../button';
import type { NoticeAction, NoticeProps } from './types';
import type { DeprecatedButtonProps } from '../button/types';
import { VisuallyHidden } from '../visually-hidden';

const noop = () => {};

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided. Passing `null` or `undefined` as the message
 * skips the announcement.
 *
 * A non-string message is read from the DOM node the returned ref is attached
 * to, rather than serialized with `renderToString`. Serializing during render
 * invokes the message components as plain functions, so any hooks they use
 * would be registered against the component rendering the notice, crashing it
 * when the message changes shape. See
 * https://github.com/WordPress/gutenberg/issues/61199.
 */
function useSpokenMessage(
	message: NoticeProps[ 'spokenMessage' ],
	politeness: NoticeProps[ 'politeness' ]
) {
	const messageContainerRef = useRef< HTMLDivElement >( null );
	const previouslySpokenRef = useRef< {
		message: string;
		politeness: NoticeProps[ 'politeness' ];
	} >();

	useEffect( () => {
		let spokenMessage;
		if ( typeof message === 'string' ) {
			spokenMessage = message;
		} else if ( message !== null && message !== undefined ) {
			spokenMessage = messageContainerRef.current?.innerHTML;
		}

		if (
			spokenMessage &&
			( spokenMessage !== previouslySpokenRef.current?.message ||
				politeness !== previouslySpokenRef.current?.politeness )
		) {
			previouslySpokenRef.current = {
				message: spokenMessage,
				politeness,
			};
			speak( spokenMessage, politeness );
		}
	} );

	return messageContainerRef;
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
	__unstableHTML,
	// onDismiss is a callback executed when the notice is dismissed.
	// It is distinct from onRemove, which _looks_ like a callback but is
	// actually the function to call to remove the notice from the UI.
	onDismiss = noop,
}: NoticeProps ) {
	const spokenMessageRef = useSpokenMessage( spokenMessage, politeness );

	// When `spokenMessage` is a distinct element (not the default `children`
	// and not a string), it has no place in the rendered output to read the
	// announcement from, so render it in a hidden container.
	const isSpokenMessageDistinctElement =
		typeof spokenMessage !== 'string' &&
		spokenMessage !== children &&
		spokenMessage !== null &&
		spokenMessage !== undefined;

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

	return (
		<div className={ classes }>
			<VisuallyHidden>{ getStatusLabel( status ) }</VisuallyHidden>
			<div
				className="components-notice__content"
				ref={
					isSpokenMessageDistinctElement
						? undefined
						: spokenMessageRef
				}
			>
				{ children }
			</div>
			{ isSpokenMessageDistinctElement && (
				<div hidden ref={ spokenMessageRef }>
					{ spokenMessage }
				</div>
			) }
			{ actions.length > 0 && (
				<div className="components-notice__actions">
					{ actions.map(
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
							if (
								typeof computedVariant === 'undefined' &&
								isPrimary
							) {
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
					) }
				</div>
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
