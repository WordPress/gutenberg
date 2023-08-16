/**
 * WordPress dependencies
 */
import {
	__experimentalInputControl as InputControl,
	Popover,
	VisuallyHidden,
	Button,
} from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';
import { useState, forwardRef, useEffect } from '@wordpress/element';
import { ENTER, ESCAPE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';
import { keyboardReturn, close } from '@wordpress/icons';

const ListViewBlockRenameUI = forwardRef(
	( { blockTitle, onSubmit, onCancel }, ref ) => {
		const inputRef = useFocusOnMount();

		const inputDescriptionId = useInstanceId(
			ListViewBlockRenameUI,
			`block-editor-list-view-block-node__input-description`
		);

		const dialogTitle = useInstanceId(
			ListViewBlockRenameUI,
			`block-editor-list-view-block-rename-dialog__title`
		);

		const dialogDescription = useInstanceId(
			ListViewBlockRenameUI,
			`block-editor-list-view-block-rename-dialog__description`
		);

		// Local state for value of input **pre-submission**.
		const [ inputValue, setInputValue ] = useState( blockTitle );

		const onKeyDownHandler = ( event ) => {
			// Trap events to input when editing to avoid
			// default list view key handing (e.g. arrow
			// keys for navigation).
			event.stopPropagation();

			// Handle ENTER and ESC exits editing mode.
			if ( event.keyCode === ENTER || event.keyCode === ESCAPE ) {
				if ( event.keyCode === ESCAPE ) {
					handleCancel();
				}

				if ( event.keyCode === ENTER ) {
					handleSubmit();
				}
			}
		};

		const handleCancel = () => {
			// Reset the input's local state to avoid
			// stale values.
			setInputValue( blockTitle );

			onCancel();

			// Must be assertive to immediately announce change.
			speak( __( 'Leaving block name edit mode' ), 'assertive' );
		};

		const handleSubmit = () => {
			let successAnnouncement;

			if ( inputValue === '' ) {
				successAnnouncement = __( 'Block name reset.' );
			} else {
				successAnnouncement = sprintf(
					/* translators: %s: new name/label for the block */
					__( 'Block name updated to: "%s".' ),
					inputValue
				);
			}

			// Must be assertive to immediately announce change.
			speak( successAnnouncement, 'assertive' );

			// Submit changes only for ENTER.
			onSubmit( inputValue );
		};

		const autoSelectInputText = ( event ) => event.target.select();

		useEffect( () => {
			speak( __( 'Entering block name edit mode' ), 'assertive' );
		}, [] );

		return (
			<Popover
				anchorRef={ ref }
				placement="overlay"
				resize={ true }
				variant="unstyled"
				animate={ false }
				className="block-editor-list-view-block-rename__popover"
				role="dialog"
				aria-labelledby={ dialogTitle }
				aria-describedby={ dialogDescription }
				onClose={ handleCancel }
			>
				<VisuallyHidden>
					<h2 id={ dialogTitle }>Rename Block</h2>
					<p id={ dialogDescription }>
						{ __( 'Choose a custom name for this block.' ) }
					</p>
				</VisuallyHidden>
				<form
					className="block-editor-list-view-block-rename__form"
					onSubmit={ ( e ) => {
						e.preventDefault();

						onSubmit( inputValue );
					} }
				>
					<InputControl
						ref={ inputRef }
						value={ inputValue }
						label={ __( 'Edit block name' ) }
						hideLabelFromVision
						onChange={ ( nextValue ) => {
							setInputValue( nextValue ?? '' );
						} }
						onFocus={ autoSelectInputText }
						onKeyDown={ onKeyDownHandler }
						aria-describedby={ inputDescriptionId }
						required
					/>
					<VisuallyHidden>
						<p id={ inputDescriptionId }>
							{ __(
								'Press the ENTER key to submit or the ESCAPE key to cancel.'
							) }
						</p>
					</VisuallyHidden>

					<div className="block-editor-list-view-block-rename__actions">
						<Button
							type="submit"
							label={ __( 'Save' ) }
							icon={ keyboardReturn }
							className="block-editor-list-view-block-rename__action block-editor-list-view-block-rename__action--submit"
						/>
						<Button
							type="button"
							onClick={ handleCancel }
							label={ __( 'Cancel' ) }
							icon={ close }
							className="block-editor-list-view-block-rename__action block-editor-list-view-block-rename__action--cancel"
						/>
					</div>
				</form>
			</Popover>
		);
	}
);

export default ListViewBlockRenameUI;
