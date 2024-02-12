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
import { __, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PATTERN_DEFAULT_CATEGORY, PATTERN_SYNC_TYPES } from '../constants';
import { store as patternsStore } from '../store';
import CategorySelector, { CATEGORY_SLUG } from './category-selector';
import { usePatternCategoriesMap } from '../private-hooks';
import { unlock } from '../lock-unlock';

export default function CreatePatternModal( {
	className = 'patterns-menu-items__convert-modal',
	modalTitle = __( 'Create pattern' ),
	...restProps
} ) {
	return (
		<Modal
			title={ modalTitle }
			onRequestClose={ restProps.onClose }
			overlayClassName={ className }
		>
			<CreatePatternModalContents { ...restProps } />
		</Modal>
	);
}

export function CreatePatternModalContents( {
	confirmLabel = __( 'Create' ),
	defaultCategories = [],
	content,
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

	const categoryMap = usePatternCategoriesMap();

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
				id: 'pattern-create',
			} );
			onError?.();
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
			const existingTerm = categoryMap.get( term.toLowerCase() );
			if ( existingTerm && existingTerm.id ) {
				return existingTerm.id;
			}
			// If we have an existing core category we need to match the new user category to the
			// correct slug rather than autogenerating it to prevent duplicates, eg. the core `Headers`
			// category uses the singular `header` as the slug.
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
		<form
			onSubmit={ ( event ) => {
				event.preventDefault();
				onCreate( title, syncType );
			} }
		>
			<VStack spacing="5">
				<TextControl
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					placeholder={ __( 'My pattern' ) }
					className="patterns-create-modal__name-input"
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<CategorySelector
					categoryTerms={ categoryTerms }
					onChange={ setCategoryTerms }
					categoryMap={ categoryMap }
				/>
				<ToggleControl
					label={ _x(
						'Synced',
						'Option that makes an individual pattern synchronized'
					) }
					help={ __(
						'Sync this pattern across multiple locations.'
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
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ () => {
							onClose();
							setTitle( '' );
						} }
					>
						{ __( 'Cancel' ) }
					</Button>

					<Button
						__next40pxDefaultSize
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
	);
}
