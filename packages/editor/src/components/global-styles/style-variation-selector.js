/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
	TextControl,
	Button,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { category, check, plus } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Hook to fetch and manage style variations.
 *
 * Uses the entity system to interact with wp_global_styles post type.
 * The REST controller at /wp/v2/global-styles handles filtering for style variations.
 *
 * @return {Object} Style variations data and actions.
 */
export function useStyleVariations() {
	const { styleVariations, isLoading } = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution } = select( coreStore );

		// Fetch style variations via the entity system.
		// The REST controller's get_items() already filters for _wp_style_variation meta.
		const records = getEntityRecords( 'postType', 'wp_global_styles', {
			per_page: 100, // TODO: We need to handle proper limits, pagination, and search
		} );

		const hasResolved = hasFinishedResolution( 'getEntityRecords', [
			'postType',
			'wp_global_styles',
			{ per_page: 100 },
		] );

		// Transform to expected format.
		const transformed = ( records || [] ).map( ( item ) => ( {
			id: item.id,
			title: item.title?.rendered || item.title?.raw || '',
		} ) );

		return {
			styleVariations: transformed,
			isLoading: ! hasResolved,
		};
	}, [] );

	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );

	const createStyleVariation = useCallback(
		async ( title ) => {
			const newVariation = await saveEntityRecord(
				'postType',
				'wp_global_styles',
				{ title, status: 'publish' },
				{ throwOnError: true }
			);
			return {
				id: newVariation.id,
				title:
					newVariation.title?.rendered ||
					newVariation.title?.raw ||
					title,
			};
		},
		[ saveEntityRecord ]
	);

	const deleteStyleVariation = useCallback(
		async ( id ) => {
			await deleteEntityRecord( 'postType', 'wp_global_styles', id, {
				force: true,
				throwOnError: true,
			} );
		},
		[ deleteEntityRecord ]
	);

	return {
		styleVariations,
		isLoading,
		createStyleVariation,
		deleteStyleVariation,
	};
}

/**
 * Modal for creating a new style variation.
 *
 * @param {Object}   props          Component props.
 * @param {boolean}  props.isOpen   Whether the modal is open.
 * @param {Function} props.onClose  Callback when modal closes.
 * @param {Function} props.onCreate Callback when style variation is created.
 * @return {JSX.Element|null} The modal component.
 */
function CreateStyleVariationModal( { isOpen, onClose, onCreate } ) {
	const [ title, setTitle ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState( null );

	if ( ! isOpen ) {
		return null;
	}

	const handleCreate = async () => {
		if ( ! title.trim() ) {
			setError( __( 'Please enter a name for the style variation.' ) );
			return;
		}

		setIsCreating( true );
		setError( null );

		try {
			await onCreate( title );
			setTitle( '' );
			onClose();
		} catch ( err ) {
			setError( err.message );
		} finally {
			setIsCreating( false );
		}
	};

	return (
		<Modal
			title={ __( 'Create style variation' ) }
			onRequestClose={ onClose }
			size="small"
		>
			<VStack spacing={ 4 }>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Name' ) }
					value={ title }
					onChange={ setTitle }
					placeholder={ __( 'Enter style variation name…' ) }
					help={ __(
						'Give your style variation a descriptive name so you can easily identify it later.'
					) }
				/>
				{ error && (
					<p className="editor-style-variation-selector__error">
						{ error }
					</p>
				) }
				<HStack justify="flex-end">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onClose }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ handleCreate }
						isBusy={ isCreating }
						disabled={ isCreating || ! title.trim() }
						accessibleWhenDisabled
					>
						{ __( 'Create' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
}

/**
 * Style Variation Selector dropdown component.
 *
 * @param {Object}   props                        Component props.
 * @param {number}   props.selectedStyleVariation The currently selected style variation ID (0 for main).
 * @param {Function} props.onSelect               Callback when a style variation is selected.
 * @param {Function} props.onOpenStyleBook        Optional callback to open the Style Book for preview.
 * @return {JSX.Element} The style variation selector component.
 */
export function StyleVariationSelector( {
	selectedStyleVariation = 0,
	onSelect,
	onOpenStyleBook,
} ) {
	const { styleVariations, isLoading, createStyleVariation } =
		useStyleVariations();
	const [ isCreateModalOpen, setIsCreateModalOpen ] = useState( false );

	const selectedVariation = styleVariations.find(
		( variation ) => variation.id === selectedStyleVariation
	);

	const handleCreate = async ( title ) => {
		const newVariation = await createStyleVariation( title );
		onSelect( newVariation.id );
		// When creating a new style variation open the Style Book automatically.
		onOpenStyleBook?.();
	};

	const handleSelectStyleVariation = ( id ) => {
		onSelect( id );
		// When selecting a style variation open the Style Book automatically.
		if ( id !== 0 ) {
			onOpenStyleBook?.();
		}
	};

	const dropdownLabel = selectedVariation
		? sprintf(
				/* translators: %s: style variation name */
				__( 'Style: %s' ),
				selectedVariation.title
		  )
		: __( 'Default' );

	const isStyleVariationSelected = selectedStyleVariation !== 0;

	return (
		<>
			<DropdownMenu
				icon={ category }
				label={ __( 'Select Style Variation' ) }
				toggleProps={ {
					size: 'compact',
					showTooltip: true,
					label: dropdownLabel,
					className: isStyleVariationSelected
						? 'is-style-variation-selected'
						: undefined,
				} }
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ __( 'Style Variations' ) }>
							<MenuItem
								role="menuitemradio"
								isSelected={ selectedStyleVariation === 0 }
								icon={
									selectedStyleVariation === 0 ? check : null
								}
								onClick={ () => {
									handleSelectStyleVariation( 0 );
									onClose();
								} }
							>
								{ __( 'Default' ) }
							</MenuItem>
							{ isLoading && (
								<MenuItem disabled>
									{ __( 'Loading…' ) }
								</MenuItem>
							) }
							{ ! isLoading &&
								styleVariations.map( ( styleVariation ) => (
									<MenuItem
										key={ styleVariation.id }
										role="menuitemradio"
										isSelected={
											selectedStyleVariation ===
											styleVariation.id
										}
										icon={
											selectedStyleVariation ===
											styleVariation.id
												? check
												: null
										}
										onClick={ () => {
											handleSelectStyleVariation(
												styleVariation.id
											);
											onClose();
										} }
									>
										{ styleVariation.title }
									</MenuItem>
								) ) }
						</MenuGroup>
						<MenuGroup>
							<MenuItem
								icon={ plus }
								onClick={ () => {
									setIsCreateModalOpen( true );
									onClose();
								} }
							>
								{ __( 'Create new style variation' ) }
							</MenuItem>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
			<CreateStyleVariationModal
				isOpen={ isCreateModalOpen }
				onClose={ () => setIsCreateModalOpen( false ) }
				onCreate={ handleCreate }
			/>
		</>
	);
}
