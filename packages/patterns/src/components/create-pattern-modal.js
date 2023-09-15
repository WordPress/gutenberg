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
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

export const ALL_PATTERNS_CATEGORY = 'all-patterns';

export const SYNC_TYPES = {
	full: undefined,
	unsynced: 'unsynced',
};

/**
 * Internal dependencies
 */
import { store } from '../store';
import CategorySelector from './category-selector';

export default function CreatePatternModal( {
	onSuccess,
	onError,
	clientIds,
	onClose,
	className = 'patterns-menu-items__convert-modal',
} ) {
	const [ syncType, setSyncType ] = useState( SYNC_TYPES.full );
	const [ categories, setCategories ] = useState( [] );
	const [ title, setTitle ] = useState( '' );
	const { createPattern } = useDispatch( store );

	const { createErrorNotice } = useDispatch( noticesStore );
	const onCreate = useCallback(
		async function ( patternTitle, sync ) {
			try {
				const newPattern = await createPattern(
					patternTitle,
					sync,
					clientIds,
					categories
				);
				onSuccess( {
					pattern: newPattern,
					categoryId: ALL_PATTERNS_CATEGORY,
				} );
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
					id: 'convert-to-pattern-error',
				} );
				onError();
			}
		},
		[
			createPattern,
			clientIds,
			onSuccess,
			createErrorNotice,
			onError,
			categories,
		]
	);

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
					/>
					<ToggleControl
						label={ __( 'Synced' ) }
						help={ __(
							'Editing the pattern will update it anywhere it is used.'
						) }
						checked={ ! syncType }
						onChange={ () => {
							setSyncType(
								syncType === SYNC_TYPES.full
									? SYNC_TYPES.unsynced
									: SYNC_TYPES.full
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

						<Button variant="primary" type="submit">
							{ __( 'Create' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
}
