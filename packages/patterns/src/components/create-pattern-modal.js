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
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PATTERN_DEFAULT_CATEGORY, PATTERN_SYNC_TYPES } from '../constants';

/**
 * Internal dependencies
 */
import { store as patternsStore } from '../store';
import CategorySelector, { CATEGORY_SLUG } from './category-selector';
import { unlock } from '../lock-unlock';

export default function CreatePatternModal( {
	onSuccess,
	onError,
	content,
	onClose,
	className = 'patterns-menu-items__convert-modal',
} ) {
	const [ syncType, setSyncType ] = useState( PATTERN_SYNC_TYPES.full );
	const [ categoryTerms, setCategoryTerms ] = useState( [] );
	const [ title, setTitle ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createPattern } = unlock( useDispatch( patternsStore ) );
	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function onCreate( patternTitle, sync ) {
		if ( ! title || isSaving ) {
			return;
		}

		try {
			setIsSaving( true );
			const categories = await Promise.all(
				categoryTerms.map( ( termName ) =>
					findOrCreateTerm( termName )
				)
			);

			const newPattern = await createPattern(
				patternTitle,
				sync,
				typeof content === 'function' ? content() : content,
				categories
			);
			onSuccess( {
				pattern: newPattern,
				categoryId: PATTERN_DEFAULT_CATEGORY,
			} );
		} catch ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
				id: 'convert-to-pattern-error',
			} );
			onError();
		} finally {
			setIsSaving( false );
			setCategoryTerms( [] );
			setTitle( '' );
		}
	}

	/**
	 * @param {string} term
	 * @return {Promise<number>} The pattern category id.
	 */
	async function findOrCreateTerm( term ) {
		try {
			const newTerm = await saveEntityRecord(
				'taxonomy',
				CATEGORY_SLUG,
				{ name: term },
				{ throwOnError: true }
			);
			invalidateResolution( 'getUserPatternCategories' );
			return newTerm.id;
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}

			return error.data.term_id;
		}
	}

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
						values={ categoryTerms }
						onChange={ setCategoryTerms }
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
							aria-disabled={ ! title || isSaving }
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
