/**
 * WordPress dependencies
 */
import {
	Button,
	VisuallyHidden,
	TextControl,
	Notice,
	CheckboxControl,
} from '@wordpress/components';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';
import { chevronLeftSmall, chevronRightSmall } from '@wordpress/icons';

/**
 * Component for creating new pages within the Navigation Link UI.
 *
 * @param {Object}   props                Component props.
 * @param {string}   props.postType       The post type to create.
 * @param {Function} props.onBack         Callback when user wants to go back.
 * @param {Function} props.onPageCreated  Callback when page is successfully created.
 * @param {string}   [props.initialTitle] Initial title to pre-fill the form.
 */
export function LinkUIPageCreator( {
	postType,
	onBack,
	onPageCreated,
	initialTitle = '',
} ) {
	const labels = useSelect(
		( select ) => select( coreStore ).getPostType( postType )?.labels,
		[ postType ]
	);
	const [ title, setTitle ] = useState( initialTitle );
	const [ shouldPublish, setShouldPublish ] = useState( false );

	// Check if the title is valid for submission
	const isTitleValid = title.trim().length > 0;

	// Get the last created entity record (without ID) to track creation state
	const { lastError, isSaving, lastCreatedRecord } = useSelect(
		( select ) => ( {
			lastError: select( coreStore ).getLastEntitySaveError(
				'postType',
				postType
			),
			isSaving: select( coreStore ).isSavingEntityRecord(
				'postType',
				postType
			),
			lastCreatedRecord: select( coreStore ).getLastEntityRecord(
				'postType',
				postType
			),
		} ),
		[ postType ]
	);

	// Check if we have a newly created page and it's resolved
	const hasNewPageResolved = useSelect(
		( select ) => {
			if ( ! lastCreatedRecord?.id ) {
				return false;
			}
			return select( coreStore ).hasResolved(
				'postType',
				'getEntityRecord',
				[ 'postType', postType, lastCreatedRecord.id ]
			);
		},
		[ lastCreatedRecord?.id, postType ]
	);

	// Get the full page data once it's resolved
	const newPage = useSelect(
		( select ) => {
			if ( ! lastCreatedRecord?.id || ! hasNewPageResolved ) {
				return null;
			}
			return select( coreStore ).getEntityRecord(
				'postType',
				postType,
				lastCreatedRecord.id
			);
		},
		[ lastCreatedRecord?.id, hasNewPageResolved, postType ]
	);

	const { saveEntityRecord } = useDispatch( coreStore );

	// If we have a resolved new page, call the callback and reset
	if ( newPage ) {
		const pageLink = {
			id: newPage.id,
			type: postType,
			title: decodeEntities( newPage.title.rendered ),
			url: newPage.link,
			kind: 'post-type',
		};
		onPageCreated( pageLink );
		return null; // Don't render anything while transitioning
	}

	async function createPage( event ) {
		event.preventDefault();
		if ( isSaving || ! isTitleValid ) {
			return;
		}

		try {
			await saveEntityRecord( 'postType', postType, {
				title,
				status: shouldPublish ? 'publish' : 'draft',
			} );
			// No need to manually handle success - the data store will update
			// and our useSelect hooks will detect the new entity
		} catch ( error ) {
			// Error handling is done via the data store selectors
		}
	}

	const isSubmitDisabled = isSaving || ! isTitleValid;
	const submitButtonText = shouldPublish
		? __( 'Publish page' )
		: __( 'Create draft' );

	return (
		<div className="link-ui-page-creator">
			<Button
				__next40pxDefaultSize
				variant="tertiary"
				onClick={ onBack }
				className="link-ui-page-creator__back"
			>
				{ isRTL() ? chevronRightSmall : chevronLeftSmall }
				<VisuallyHidden>{ __( 'Go back' ) }</VisuallyHidden>
			</Button>

			<h2>
				{ sprintf(
					/* translators: %s: post type label */
					__( 'Add new %s' ),
					labels?.singular_name || postType
				) }
			</h2>

			<form onSubmit={ createPage }>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Title' ) }
					onChange={ setTitle }
					placeholder={ __( 'No title' ) }
					value={ title }
				/>
				<CheckboxControl
					__nextHasNoMarginBottom
					label={ __( 'Publish immediately' ) }
					help={ __(
						'If unchecked, the page will be created as a draft.'
					) }
					checked={ shouldPublish }
					onChange={ setShouldPublish }
				/>
				{ lastError && (
					<Notice
						status="error"
						isDismissible={ false }
						className="link-ui-page-creator__error"
					>
						{ lastError.message }
					</Notice>
				) }
				<Button
					__next40pxDefaultSize
					variant="primary"
					type="submit"
					isBusy={ isSaving }
					aria-disabled={ isSubmitDisabled }
				>
					{ submitButtonText }
				</Button>
			</form>
		</div>
	);
}
