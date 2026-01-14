/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
} from '@wordpress/components';
import { moreVertical, backup, download, upload } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';

/**
 * Header component with actions.
 *
 * @param {Object}   props               Component props.
 * @param {boolean}  props.hasDraft      Whether draft exists.
 * @param {boolean}  props.isSaving      Whether saving.
 * @param {boolean}  props.isPublishing  Whether publishing.
 * @param {Function} props.onShowHistory Callback to show history.
 * @return {JSX.Element} Header component.
 */
export default function Header( {
	hasDraft,
	isSaving,
	isPublishing,
	onShowHistory,
} ) {
	const [ showPublishConfirm, setShowPublishConfirm ] = useState( false );
	const [ showDiscardConfirm, setShowDiscardConfirm ] = useState( false );

	const { draftHasChanges } = useSelect( ( select ) => {
		return {
			draftHasChanges: select( STORE_NAME ).draftHasChanges(),
		};
	}, [] );

	const { saveDraft, publishDraft, discardDraft } = useDispatch( STORE_NAME );

	const handleSaveDraft = () => {
		saveDraft();
	};

	const handlePublish = () => {
		setShowPublishConfirm( true );
	};

	const confirmPublish = () => {
		publishDraft();
		setShowPublishConfirm( false );
	};

	const handleDiscard = () => {
		setShowDiscardConfirm( true );
	};

	const confirmDiscard = () => {
		discardDraft();
		setShowDiscardConfirm( false );
	};

	return (
		<div className="content-guidelines-header">
			<div className="content-guidelines-header__left">
				<h1 className="content-guidelines-header__title">
					{ __( 'Content Guidelines', 'content-guidelines' ) }
				</h1>

				{ hasDraft && draftHasChanges && (
					<span className="content-guidelines-header__status content-guidelines-header__status--draft">
						{ __( 'Draft changes', 'content-guidelines' ) }
					</span>
				) }

				{ ! hasDraft && (
					<span className="content-guidelines-header__status content-guidelines-header__status--active">
						{ __( 'Active', 'content-guidelines' ) }
					</span>
				) }
			</div>

			<div className="content-guidelines-header__actions">
				{ draftHasChanges && (
					<Button
						variant="tertiary"
						onClick={ handleDiscard }
						disabled={ isSaving || isPublishing }
					>
						{ __( 'Discard', 'content-guidelines' ) }
					</Button>
				) }

				<Button
					variant="secondary"
					onClick={ handleSaveDraft }
					isBusy={ isSaving }
					disabled={ isSaving || isPublishing || ! draftHasChanges }
				>
					{ isSaving
						? __( 'Saving...', 'content-guidelines' )
						: __( 'Save draft', 'content-guidelines' ) }
				</Button>

				<Button
					variant="primary"
					onClick={ handlePublish }
					isBusy={ isPublishing }
					disabled={ isSaving || isPublishing || ! draftHasChanges }
				>
					{ isPublishing
						? __( 'Publishing...', 'content-guidelines' )
						: __( 'Publish', 'content-guidelines' ) }
				</Button>

				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'More options', 'content-guidelines' ) }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							<MenuItem
								icon={ backup }
								onClick={ () => {
									onShowHistory();
									onClose();
								} }
							>
								{ __( 'History', 'content-guidelines' ) }
							</MenuItem>
							<MenuItem
								icon={ download }
								onClick={ () => {
									// Export functionality.
									onClose();
								} }
							>
								{ __( 'Export', 'content-guidelines' ) }
							</MenuItem>
							<MenuItem
								icon={ upload }
								onClick={ () => {
									// Import functionality.
									onClose();
								} }
							>
								{ __( 'Import', 'content-guidelines' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			</div>

			{ showPublishConfirm && (
				<Modal
					title={ __( 'Publish guidelines?', 'content-guidelines' ) }
					onRequestClose={ () => setShowPublishConfirm( false ) }
					size="small"
				>
					<p>
						{ __(
							'This will make your draft changes the active guidelines for all AI features.',
							'content-guidelines'
						) }
					</p>
					<div className="content-guidelines-modal__actions">
						<Button
							variant="tertiary"
							onClick={ () => setShowPublishConfirm( false ) }
						>
							{ __( 'Cancel', 'content-guidelines' ) }
						</Button>
						<Button variant="primary" onClick={ confirmPublish }>
							{ __( 'Publish', 'content-guidelines' ) }
						</Button>
					</div>
				</Modal>
			) }

			{ showDiscardConfirm && (
				<Modal
					title={ __( 'Discard draft?', 'content-guidelines' ) }
					onRequestClose={ () => setShowDiscardConfirm( false ) }
					size="small"
				>
					<p>
						{ __(
							'This will discard all unsaved changes. This action cannot be undone.',
							'content-guidelines'
						) }
					</p>
					<div className="content-guidelines-modal__actions">
						<Button
							variant="tertiary"
							onClick={ () => setShowDiscardConfirm( false ) }
						>
							{ __( 'Cancel', 'content-guidelines' ) }
						</Button>
						<Button isDestructive onClick={ confirmDiscard }>
							{ __( 'Discard', 'content-guidelines' ) }
						</Button>
					</div>
				</Modal>
			) }
		</div>
	);
}
