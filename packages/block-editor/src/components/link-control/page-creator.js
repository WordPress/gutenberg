/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Button,
	TextControl,
	Notice,
	CheckboxControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { chevronLeftSmall } from '@wordpress/icons';

function generateSlug( text ) {
	const cleanSlug = text
		.toLowerCase()
		.replace( /[^a-z0-9\s-]/g, '' )
		.replace( /\s+/g, '-' )
		.replace( /-+/g, '-' )
		.trim();

	return cleanSlug ? '/' + cleanSlug : '';
}

/**
 * Inline page creation form for LinkControl.
 *
 * Page creation is delegated to the consumer via onCreateSuggestion, which
 * already carries the saveEntityRecord call.
 *
 * @param {Object}   props
 * @param {string}   props.initialTitle       Pre-populated from the search input value.
 * @param {Function} props.onCreateSuggestion Consumer-provided async creator: (title) => suggestion.
 * @param {Function} props.onPageCreated      Called with the resulting link object on success.
 * @param {Function} props.onCancel           Called when the user cancels.
 */
export function LinkControlPageCreator( {
	initialTitle = '',
	onCreateSuggestion,
	onPageCreated,
	onCancel,
} ) {
	const [ title, setTitle ] = useState( initialTitle );
	const [ isCreating, setIsCreating ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( null );
	const [ publishImmediately, setPublishImmediately ] = useState( true );
	const [ slug, setSlug ] = useState( generateSlug( initialTitle ) );
	const [ isSlugDirty, setIsSlugDirty ] = useState( false );
	const backButtonRef = useRef();

	useEffect( () => {
		backButtonRef.current?.focus();
	}, [] );

	const handleTitleChange = ( newTitle ) => {
		setTitle( newTitle );
		if ( ! isSlugDirty ) {
			setSlug( generateSlug( newTitle ) );
		}
	};

	const handleSlugChange = ( newSlug ) => {
		setSlug( newSlug );
		setIsSlugDirty( true );
	};

	const handleCreate = async () => {
		if ( ! title?.trim() ) {
			return;
		}

		setIsCreating( true );
		setErrorMessage( null );
		try {
			const suggestion = await onCreateSuggestion(
				title.trim(),
				publishImmediately,
				slug.trim()
			);
			if ( suggestion?.url ) {
				onPageCreated( suggestion );
			}
		} catch ( _e ) {
			setErrorMessage(
				__( 'There was an error creating the page. Please try again.' )
			);
			setIsCreating( false );
		}
	};

	return (
		<div className="block-editor-link-control__page-creator">
			<Button
				ref={ backButtonRef }
				className="block-editor-link-control__page-creator__back"
				icon={ chevronLeftSmall }
				onClick={ onCancel }
				size="small"
			>
				{ __( 'Back' ) }
			</Button>
			<div className="block-editor-link-control__page-creator__inner">
				{ errorMessage && (
					<Notice status="error" isDismissible={ false }>
						{ errorMessage }
					</Notice>
				) }
				<VStack spacing={ 4 }>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'Page title' ) }
						value={ title }
						onChange={ handleTitleChange }
						placeholder={ __( 'Enter page title' ) }
						onKeyDown={ ( event ) => {
							if ( event.key === 'Enter' ) {
								event.preventDefault();
								handleCreate();
							}
						} }
						disabled={ isCreating }
					/>
					<TextControl
						__next40pxDefaultSize
						label={ __( 'URL slug' ) }
						value={ slug }
						onChange={ handleSlugChange }
						help={ __(
							'Auto-generated from the title. Edit to customise.'
						) }
						disabled={ isCreating }
					/>
					<CheckboxControl
						label={ __( 'Publish immediately' ) }
						help={ __(
							'If unchecked, the page will be created as a draft.'
						) }
						checked={ publishImmediately }
						onChange={ setPublishImmediately }
						disabled={ isCreating }
					/>
					<HStack justify="right" spacing={ 2 }>
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onCancel }
							disabled={ isCreating }
							accessibleWhenDisabled
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ handleCreate }
							isBusy={ isCreating }
							disabled={ ! title?.trim() || isCreating }
							accessibleWhenDisabled
						>
							{ isCreating ? __( 'Creating…' ) : __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</div>
		</div>
	);
}
