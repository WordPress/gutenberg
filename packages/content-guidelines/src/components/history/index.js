/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import {
	Modal,
	Button,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { backup } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import './style.scss';

/**
 * Format date for display.
 *
 * @param {string} dateString ISO date string.
 * @return {string} Formatted date.
 */
function formatDate( dateString ) {
	const date = new Date( dateString );
	return date.toLocaleString( undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	} );
}

/**
 * History panel component.
 *
 * @param {Object}   props         Component props.
 * @param {Function} props.onClose Callback to close panel.
 * @return {JSX.Element} History panel.
 */
export default function HistoryPanel( { onClose } ) {
	const [ confirmRestore, setConfirmRestore ] = useState( null );

	const { revisions, isRestoring } = useSelect( ( select ) => {
		return {
			revisions: select( STORE_NAME ).getRevisions(),
			isRestoring: select( STORE_NAME ).isRestoring(),
		};
	}, [] );

	const { fetchRevisions, restoreRevision } = useDispatch( STORE_NAME );

	// Fetch revisions on mount.
	useEffect( () => {
		fetchRevisions();
	}, [ fetchRevisions ] );

	const handleRestore = ( revisionId ) => {
		setConfirmRestore( revisionId );
	};

	const confirmRestoreAction = () => {
		if ( confirmRestore ) {
			restoreRevision( confirmRestore );
			setConfirmRestore( null );
		}
	};

	const isLoading = revisions === undefined;

	return (
		<Modal
			title={ __( 'Guidelines History', 'content-guidelines' ) }
			onRequestClose={ onClose }
			className="content-guidelines-history-modal"
			size="medium"
		>
			<div className="content-guidelines-history">
				{ isLoading && (
					<div className="content-guidelines-history__loading">
						<Spinner />
						<p>{ __( 'Loading history...', 'content-guidelines' ) }</p>
					</div>
				) }

				{ ! isLoading && revisions.length === 0 && (
					<div className="content-guidelines-history__empty">
						<p>
							{ __(
								'No revision history yet. History is created when you publish changes.',
								'content-guidelines'
							) }
						</p>
					</div>
				) }

				{ ! isLoading && revisions.length > 0 && (
					<ul className="content-guidelines-history__list">
						{ revisions.map( ( revision, index ) => (
							<li
								key={ revision.id }
								className="content-guidelines-history__item"
							>
								<div className="content-guidelines-history__item-icon">
									<backup />
								</div>
								<div className="content-guidelines-history__item-content">
									<div className="content-guidelines-history__item-date">
										{ formatDate( revision.date ) }
										{ index === 0 && (
											<span className="content-guidelines-history__current-badge">
												{ __( 'Current', 'content-guidelines' ) }
											</span>
										) }
									</div>
									<div className="content-guidelines-history__item-author">
										{ revision.author?.name ||
											__( 'Unknown', 'content-guidelines' ) }
									</div>
								</div>
								<div className="content-guidelines-history__item-actions">
									{ index > 0 && (
										<Button
											variant="secondary"
											size="small"
											onClick={ () =>
												handleRestore( revision.id )
											}
											disabled={ isRestoring }
										>
											{ __( 'Restore', 'content-guidelines' ) }
										</Button>
									) }
								</div>
							</li>
						) ) }
					</ul>
				) }

				{ isRestoring && (
					<div className="content-guidelines-history__restoring">
						<Spinner />
						<p>{ __( 'Restoring...', 'content-guidelines' ) }</p>
					</div>
				) }
			</div>

			{ confirmRestore && (
				<ConfirmDialog
					onConfirm={ confirmRestoreAction }
					onCancel={ () => setConfirmRestore( null ) }
				>
					{ __(
						'Restore this version? This will become the new active guidelines.',
						'content-guidelines'
					) }
				</ConfirmDialog>
			) }
		</Modal>
	);
}
