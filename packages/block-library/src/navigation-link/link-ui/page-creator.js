/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	Notice,
	CheckboxControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DialogWrapper from './dialog-wrapper';

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
	const [ title, setTitle ] = useState( initialTitle );
	const [ shouldPublish, setShouldPublish ] = useState( false );

	// Check if the title is valid for submission
	const isTitleValid = title.trim().length > 0;

	// Get the last created entity record (without ID) to track creation state
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			lastError: select( coreStore ).getLastEntitySaveError(
				'postType',
				postType
			),
			isSaving: select( coreStore ).isSavingEntityRecord(
				'postType',
				postType
			),
		} ),
		[ postType ]
	);

	const { saveEntityRecord } = useDispatch( coreStore );

	async function createPage( event ) {
		event.preventDefault();
		if ( isSaving || ! isTitleValid ) {
			return;
		}

		try {
			const savedRecord = await saveEntityRecord(
				'postType',
				postType,
				{
					title,
					status: shouldPublish ? 'publish' : 'draft',
				},
				{ throwOnError: true }
			);

			if ( savedRecord ) {
				// Create the page link object from the saved record
				const pageLink = {
					id: savedRecord.id,
					type: postType,
					title: decodeEntities( savedRecord.title.rendered ),
					url: savedRecord.link,
					kind: 'post-type',
				};

				onPageCreated( pageLink );
			}
		} catch ( error ) {
			// Error handling is done via the data store selectors
		}
	}

	const isSubmitDisabled = isSaving || ! isTitleValid;

	return (
		<DialogWrapper
			className="link-ui-page-creator"
			title={ __( 'Create page' ) }
			description={ __( 'Create a new page to add to your Navigation.' ) }
			onBack={ onBack }
		>
			<VStack className="link-ui-page-creator__inner" spacing={ 4 }>
				<form onSubmit={ createPage }>
					<VStack spacing={ 4 }>
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
							<Notice status="error" isDismissible={ false }>
								{ lastError.message }
							</Notice>
						) }

						<HStack spacing={ 2 } justify="flex-end">
							<Button
								__next40pxDefaultSize
								variant="tertiary"
								onClick={ onBack }
								disabled={ isSaving }
								accessibleWhenDisabled
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								__next40pxDefaultSize
								variant="primary"
								type="submit"
								isBusy={ isSaving }
								aria-disabled={ isSubmitDisabled }
							>
								{ __( 'Create page' ) }
							</Button>
						</HStack>
					</VStack>
				</form>
			</VStack>
		</DialogWrapper>
	);
}
