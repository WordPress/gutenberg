/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML, useEffect, renderToString } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { NoticeAction, NoticeProps } from './types';
import type { SyntheticEvent } from 'react';
import type { DeprecatedButtonProps } from '../button/types';

const noop = () => {};

/**
 * Custom hook which announces the message with the given politeness, if a
 * valid message is provided.
 */
function useSpokenMessage(
	message: NoticeProps[ 'spokenMessage' ],
	politeness: NoticeProps[ 'politeness' ]
) {
	const spokenMessage =
		typeof message === 'string' ? message : renderToString( message );

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

		case 'error':
		default:
			return 'assertive';
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
	useSpokenMessage( spokenMessage, politeness );

	const classes = classnames(
		className,
		'components-notice',
		'is-' + status,
		{
			'is-dismissible': isDismissible,
		}
	);

	if ( __unstableHTML && typeof children === 'string' ) {
		children = <RawHTML>{ children }</RawHTML>;
	}

	const onDismissNotice = ( event: SyntheticEvent ) => {
		event?.preventDefault?.();
		onDismiss();
		onRemove();
	};

	return (
		<div className={ classes }>
			<div className="components-notice__content">
				{ children }
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
									key={ index }
									href={ url }
									variant={ computedVariant }
									onClick={ url ? undefined : onClick }
									className={ classnames(
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
			</div>
			{ isDismissible && (
				<Button
					className="components-notice__dismiss"
					icon={ close }
					label={ __( 'Dismiss this notice' ) }
					onClick={ onDismissNotice }
					showTooltip={ false }
				/>
			) }
		</div>
	);
}

export default Notice;
