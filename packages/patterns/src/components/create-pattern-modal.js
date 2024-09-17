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
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import {
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_SYNC_TYPES,
	PATTERN_TYPES,
} from '../constants';
import { store as patternsStore } from '../store';
import CategorySelector from './category-selector';
import { useAddPatternCategory } from '../private-hooks';
import { unlock } from '../lock-unlock';

export default function CreatePatternModal( {
	className = 'patterns-menu-items__convert-modal',
	modalTitle,
	...restProps
} ) {
	const defaultModalTitle = useSelect(
		( select ) =>
			select( coreStore ).getPostType( PATTERN_TYPES.user )?.labels
				?.add_new_item,
		[]
	);
	return (
		<Modal
			title={ modalTitle || defaultModalTitle }
			onRequestClose={ restProps.onClose }
			overlayClassName={ className }
			focusOnMount="firstContentElement"
			size="small"
		>
			<CreatePatternModalContents { ...restProps } />
		</Modal>
	);
}

export function CreatePatternModalContents( {
	confirmLabel = __( 'Add' ),
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
	const { createErrorNotice } = useDispatch( noticesStore );

	const { categoryMap, findOrCreateTerm } = useAddPatternCategory();

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
					__nextHasNoMarginBottom
					label={ _x( 'Synced', 'pattern (singular)' ) }
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
