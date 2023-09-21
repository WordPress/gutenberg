/**
 * WordPress dependencies
 */
import {
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { PATTERN_DEFAULT_CATEGORY, PATTERN_SYNC_TYPES } from '../constants';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import CategorySelector from './category-selector';
import { unlock } from '../lock-unlock';

export default function CreatePatternModal( {
	onSuccess,
	onError,
	content,
	onClose,
	className = 'patterns-menu-items__convert-modal',
} ) {
	const [ syncType, setSyncType ] = useState( PATTERN_SYNC_TYPES.full );
	const [ categories, setCategories ] = useState( [] );
	const [ title, setTitle ] = useState( '' );
	const [ saveCategoryPromise, setSaveCategoryPromise ] = useState();
	const [ isSaving, setIsSaving ] = useState();
	const { createPattern } = unlock( useDispatch( patternsStore ) );

	const { createErrorNotice } = useDispatch( noticesStore );

	async function addPattern( patternTitle, sync, patternCategories ) {
		try {
			const newPattern = await createPattern(
				patternTitle,
				sync,
				typeof content === 'function' ? content() : content,
				patternCategories
			);
			setIsSaving( false );
			onSuccess( {
				pattern: newPattern,
				categoryId: PATTERN_DEFAULT_CATEGORY,
			} );
		} catch ( error ) {
			setIsSaving( false );
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: 'convert-to-pattern-error',
			} );
			onError();
		}
	}

	async function onCreate( patternTitle, sync ) {
		setIsSaving( true );
		// Check that any onBlur save of the categories is completed
		// before creating the pattern and closing the modal.
		if ( saveCategoryPromise ) {
			const newTerms = await saveCategoryPromise;
			addPattern(
				patternTitle,
				sync,
				newTerms.map( ( cat ) => cat.id )
			);
			return;
		}
		addPattern( patternTitle, sync, categories );
	}

	const handleCategorySelection = ( selectedCategories ) => {
		setCategories( selectedCategories.map( ( cat ) => cat.id ) );
	};

	return (
		<Modal
			title={ __( 'Create pattern' ) }
			onRequestClose={ () => {
				onClose();
				setTitle( '' );
			} }
			overlayClassName={ className }
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					onCreate( title, syncType );
					setTitle( '' );
				} }
			>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						placeholder={ __( 'My pattern' ) }
						className="patterns-create-modal__name-input"
					/>
					<CategorySelector
						onCategorySelection={ handleCategorySelection }
						setSaveCategoryPromise={ setSaveCategoryPromise }
					/>
					<ToggleControl
						label={ __( 'Synced' ) }
						help={ __(
							'Editing the pattern will update it anywhere it is used.'
						) }
						checked={ syncType === PATTERN_SYNC_TYPES.full }
						onChange={ () => {
							setSyncType(
								syncType === PATTERN_SYNC_TYPES.full
									? PATTERN_SYNC_TYPES.unsynced
									: PATTERN_SYNC_TYPES.full
							);
						} }
					/>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ () => {
								onClose();
								setTitle( '' );
							} }
						>
							{ __( 'Cancel' ) }
						</Button>

						<Button
							variant="primary"
							type="submit"
							disabled={ isSaving }
							aria-disabled={ isSaving }
							isBusy={ isSaving }
						>
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
