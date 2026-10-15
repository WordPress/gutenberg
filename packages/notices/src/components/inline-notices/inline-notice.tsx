import { speak } from '@wordpress/a11y';
import { RawHTML, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
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
 * one with the same ID. Only the message is announced: action labels are not
 * part of the message.
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
	action: { label, url, onClick, className, variant, isPrimary },
}: {
	action: NoticeAction;
} ) {
	if ( url ) {
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
		>
			{ label }
		</Notice.ActionButton>
	);
}

export default function InlineNotice( {
	notice,
	onRemove,
}: InlineNoticeProps ) {
	const { status, content, __unstableHTML, isDismissible, onDismiss } =
		notice;
	const actions = notice.actions as NoticeAction[];

	useAnnouncement( notice );

	return (
		<Notice.Root
			intent={ status }
			className={ clsx(
				'notices-inline-notices__notice',
				`is-${ status }`
			) }
		>
			<VisuallyHidden>{ getStatusLabel( status ) }</VisuallyHidden>
			{ __unstableHTML ? (
				<Notice.Description render={ <div /> }>
					<RawHTML>{ content }</RawHTML>
				</Notice.Description>
			) : (
				<Notice.Description>{ content }</Notice.Description>
			) }
			{ actions.length > 0 && (
				<Notice.Actions>
					{ actions.map( ( action, index ) => (
						<NoticeActionControl key={ index } action={ action } />
					) ) }
				</Notice.Actions>
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
		</Notice.Root>
	);
}
