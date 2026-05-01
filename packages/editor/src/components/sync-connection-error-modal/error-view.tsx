/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

type ErrorViewProps = {
	description: string;
	retryCountdownText: string;
	editPostHref: string;
	postTypeLabel: string;
	copyButtonRef: Ref< HTMLButtonElement >;
	manualRetry?: () => void;
	isRetrying: boolean;
	onEditAnyway: () => void;
};

// Body of the sync connection error modal when the user first sees the
// disconnection. Offers to retry, leave, copy post content, or proceed
// into offline editing via the Edit Anyway button.
export default function ErrorView( {
	description,
	retryCountdownText,
	editPostHref,
	postTypeLabel,
	copyButtonRef,
	manualRetry,
	isRetrying,
	onEditAnyway,
}: ErrorViewProps ) {
	return (
		<>
			<p>{ description }</p>
			{ retryCountdownText && (
				<p className="editor-sync-connection-error-modal__retry-countdown">
					{ retryCountdownText }
				</p>
			) }
			<Stack justify="flex-end" gap="sm">
				<Button
					__next40pxDefaultSize
					href={ editPostHref }
					isDestructive
					variant="tertiary"
				>
					{ sprintf(
						/* translators: %s: Post type name (e.g., "Posts", "Pages"). */
						__( 'Back to %s' ),
						postTypeLabel
					) }
				</Button>
				<Button
					__next40pxDefaultSize
					ref={ copyButtonRef }
					variant="secondary"
				>
					{ __( 'Copy Post Content' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant={ manualRetry ? 'secondary' : 'primary' }
					onClick={ onEditAnyway }
				>
					{ __( 'Edit Anyway' ) }
				</Button>
				{ manualRetry && (
					<Button
						__next40pxDefaultSize
						accessibleWhenDisabled
						aria-disabled={ isRetrying }
						disabled={ isRetrying }
						isBusy={ isRetrying }
						variant="primary"
						onClick={ manualRetry }
					>
						{ __( 'Retry' ) }
					</Button>
				) }
			</Stack>
		</>
	);
}
