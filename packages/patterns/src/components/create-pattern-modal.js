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
import { useState, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
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
	confirmLabel = __( 'Create' ),
	defaultCategories = [],
	className = 'patterns-menu-items__convert-modal',
	content,
	modalTitle = __( 'Create pattern' ),
	onClose,
	onError,
	onSuccess,
	defaultSyncType = PATTERN_SYNC_TYPES.full,
	defaultTitle = '',
} ) {
	const [ syncType, setSyncType ] = useState( defaultSyncType );
	const [ categoryTerms, setCategoryTerms ] = useState( defaultCategories );
	const [ title, setTitle ] = useState( defaultTitle );

	const [ isSaving, setIsSaving ] = useState( false );
	const { createPattern } = unlock( useDispatch( patternsStore ) );
	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const { corePatternCategories, userPatternCategories } = useSelect(
		( select ) => {
			const { getUserPatternCategories, getBlockPatternCategories } =
				select( coreStore );

			return {
				corePatternCategories: getBlockPatternCategories(),
				userPatternCategories: getUserPatternCategories(),
			};
		}
	);

	const categoryMap = useMemo( () => {
		// Merge the user and core pattern categories and remove any duplicates.
		const uniqueCategories = new Map();
		[ ...userPatternCategories, ...corePatternCategories ].forEach(
			( category ) => {
				if (
					! uniqueCategories.has( category.label ) &&
					// There are two core categories with `Post` label so explicitly remove the one with
					// the `query` slug to avoid any confusion.
					category.name !== 'query'
				) {
					// We need to store the name separately as this is used as the slug in the
					// taxonomy and may vary from the label.
					uniqueCategories.set( category.label, {
						label: category.label,
						value: category.label,
						name: category.name,
					} );
				}
			}
		);
		return uniqueCategories;
	}, [ userPatternCategories, corePatternCategories ] );

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
			// We need to match any existing term to the correct slug to prevent duplicates, eg.
			// the core `Headers` category uses the singular `header` as the slug.
			const existingTerm = categoryMap.get( term );
			const termData = existingTerm
				? { name: existingTerm.label, slug: existingTerm.name }
				: { name: term };
			const newTerm = await saveEntityRecord(
				'taxonomy',
				CATEGORY_SLUG,
				termData,
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
			title={ modalTitle }
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
						categoryTerms={ categoryTerms }
						onChange={ setCategoryTerms }
						categoryMap={ categoryMap }
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
							{ confirmLabel }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
