import { speak } from '@wordpress/a11y';
import { Slot } from '@wordpress/components';
import { RawHTML, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Collapsible, Notice, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import CopyButton from './copy-button';
import DetailsText from './details-text';
import { NOTICE_SLOT } from '../../store/constants';
import type {
	Notice as NoticeType,
	NoticeAction as NoticeActionType,
} from '../../store/types';

/**
 * Notice actions have long accepted a few props of the `@wordpress/components`
 * `Button`, beyond the documented `label`, `url`, and `onClick`.
 */
type NoticeAction = NoticeActionType & {
	className?: string;
	variant?: string;
	isPrimary?: boolean;
	disabled?: boolean;
};

type InlineNoticeProps = {
	notice: NoticeType;
	onRemove: () => void;
};

function getStatusLabel( status: NoticeType[ 'status' ] ) {
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
 * Announces a notice when it is created, including when a new notice replaces
 * one with the same ID. Only the message is announced: details are read when
 * the user opens them, and action labels are not part of the message.
 *
 * @param notice The notice to announce.
 */
function useAnnouncement( notice: NoticeType ) {
	const { spokenMessage, status } = notice;
	useEffect( () => {
		if ( spokenMessage ) {
			speak( spokenMessage, status === 'error' ? 'assertive' : 'polite' );
		}
		// Each `createNotice` call stores a new notice object, so depending
		// on it announces every new notice, even one with the same message.
	}, [ notice, spokenMessage, status ] );
}

function NoticeActionControl( {
	action: { label, url, onClick, className, variant, isPrimary, disabled },
}: {
	action: NoticeAction;
} ) {
	// A link cannot be disabled, so a disabled action is always a button.
	if ( url && ! disabled ) {
		return (
			<Notice.ActionLink
				href={ url }
				onClick={ onClick }
				className={ className }
			>
				{ label }
			</Notice.ActionLink>
		);
	}

	return (
		<Notice.ActionButton
			variant={ variant === 'primary' || isPrimary ? 'solid' : 'outline' }
			onClick={ onClick }
			className={ className }
			disabled={ disabled }
		>
			{ label }
		</Notice.ActionButton>
	);
}

export default function InlineNotice( {
	notice,
	onRemove,
}: InlineNoticeProps ) {
	const {
		status,
		content,
		details,
		__unstableHTML,
		isDismissible,
		onDismiss,
	} = notice;
	const actions = notice.actions as NoticeAction[];
	const slot = ( notice as Record< symbol, unknown > )[ NOTICE_SLOT ] as
		symbol | undefined;
	const [ isOpen, setIsOpen ] = useState( false );

	useAnnouncement( notice );

	// Copying HTML content would put its tags on the clipboard.
	const canCopy = !! details && ! __unstableHTML;
	const hasActions = actions.length > 0 || !! details;

	const children = (
		<>
			<VisuallyHidden>{ getStatusLabel( status ) }</VisuallyHidden>
			{ __unstableHTML ? (
				<Notice.Description render={ <div /> }>
					<RawHTML>{ content }</RawHTML>
				</Notice.Description>
			) : (
				<Notice.Description>
					{ content }
					{ slot && (
						<>
							{ ' ' }
							<Slot name={ slot } />
						</>
					) }
				</Notice.Description>
			) }
			{ hasActions && (
				<Notice.Actions>
					{ actions.map( ( action, index ) => (
						<NoticeActionControl key={ index } action={ action } />
					) ) }
					{ !! details && (
						<Collapsible.Trigger
							render={ <Notice.ActionButton variant="outline" /> }
						>
							{ isOpen
								? __( 'Hide details' )
								: __( 'Show details' ) }
						</Collapsible.Trigger>
					) }
					{ canCopy && (
						<CopyButton
							text={ `${ content }\n\n${ details }` }
							label={
								status === 'error'
									? __( 'Copy error' )
									: __( 'Copy message' )
							}
						/>
					) }
				</Notice.Actions>
			) }
			{ !! details && (
				<Collapsible.Panel
					hiddenUntilFound
					className="notices-inline-notices__details"
					render={ <Notice.Description render={ <div /> } /> }
				>
					<DetailsText>{ details }</DetailsText>
				</Collapsible.Panel>
			) }
			{ isDismissible && (
				<Notice.CloseIconButton
					label={ __( 'Close' ) }
					onClick={ () => {
						onDismiss?.();
						onRemove();
					} }
				/>
			) }
		</>
	);

	const rootProps = {
		intent: status,
		className: clsx( 'notices-inline-notices__notice', `is-${ status }` ),
	};

	if ( ! details ) {
		return <Notice.Root { ...rootProps }>{ children }</Notice.Root>;
	}

	return (
		<Collapsible.Root
			open={ isOpen }
			onOpenChange={ setIsOpen }
			render={ <Notice.Root { ...rootProps } /> }
		>
			{ children }
		</Collapsible.Root>
	);
}
