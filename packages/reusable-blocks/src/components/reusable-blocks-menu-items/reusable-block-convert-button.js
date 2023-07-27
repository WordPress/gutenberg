/**
 * External dependencies
 */
import escapeHtml from 'escape-html';

/**
 * WordPress dependencies
 */
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useCallback, useState } from '@wordpress/element';
import {
	MenuItem,
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	ToggleControl,
	SelectControl,
} from '@wordpress/components';
import { symbol } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store } from '../../store';
import { unlock } from '../../lock-unlock';

const unescapeString = ( arg ) => {
	return decodeEntities( arg );
};

/**
 * Returns a term object with name unescaped.
 *
 * @param {Object} term The term object to unescape.
 *
 * @return {Object} Term object with name property unescaped.
 */
const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};
// Tries to create a term or fetch it if it already exists.
function findOrCreateTerm( category ) {
	const escapedTermName = escapeHtml( category.label );
	const escapedTermSlug = escapeHtml( category.value );
	const escapedTermDescription = escapeHtml( category.description );
	return apiFetch( {
		path: '/wp/v2/wp_pattern',
		method: 'POST',
		data: {
			name: escapedTermName,
			slug: escapedTermSlug,
			description: escapedTermDescription,
		},
	} )
		.catch( ( error ) => {
			if ( error.code !== 'term_exists' ) {
				return Promise.reject( error );
			}

			return Promise.resolve( {
				id: error.data.term_id,
				name: category.label,
			} );
		} )
		.then( unescapeTerm );
}
/**
 * Menu control to convert block(s) to reusable block.
 *
 * @param {Object}   props              Component props.
 * @param {string[]} props.clientIds    Client ids of selected blocks.
 * @param {string}   props.rootClientId ID of the currently selected top-level block.
 * @return {import('@wordpress/element').WPComponent} The menu control or null.
 */
export default function ReusableBlockConvertButton( {
	clientIds,
	rootClientId,
} ) {
	const { useReusableBlocksRenameHint, ReusableBlocksRenameHint } = unlock(
		blockEditorPrivateApis
	);
	const showRenameHint = useReusableBlocksRenameHint();
	const [ syncType, setSyncType ] = useState( undefined );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const [ categorySlug, setCategorySlug ] = useState( '' );
	const canConvert = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const {
				getBlocksByClientId,
				canInsertBlockType,
				getBlockRootClientId,
			} = select( blockEditorStore );

			const rootId =
				rootClientId ||
				( clientIds.length > 0
					? getBlockRootClientId( clientIds[ 0 ] )
					: undefined );

			const blocks = getBlocksByClientId( clientIds ) ?? [];

			const isReusable =
				blocks.length === 1 &&
				blocks[ 0 ] &&
				isReusableBlock( blocks[ 0 ] ) &&
				!! select( coreStore ).getEntityRecord(
					'postType',
					'wp_block',
					blocks[ 0 ].attributes.ref
				);

			const _canConvert =
				// Hide when this is already a reusable block.
				! isReusable &&
				// Hide when reusable blocks are disabled.
				canInsertBlockType( 'core/block', rootId ) &&
				blocks.every(
					( block ) =>
						// Guard against the case where a regular block has *just* been converted.
						!! block &&
						// Hide on invalid blocks.
						block.isValid &&
						// Hide when block doesn't support being made reusable.
						hasBlockSupport( block.name, 'reusable', true )
				) &&
				// Hide when current doesn't have permission to do that.
				!! canUser( 'create', 'blocks' );

			return _canConvert;
		},
		[ clientIds, rootClientId ]
	);

	const { __experimentalConvertBlocksToReusable: convertBlocksToReusable } =
		useDispatch( store );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const patternCategories = categories === null ? [] : categories;
	const categoryOptions = patternCategories.map( ( cat ) => ( {
		label: cat.name,
		value: cat.slug,
		taxonomyId: cat.id,
	} ) );

	corePatternCategories
		.filter( ( cat ) => cat.name !== 'query' )
		.forEach( ( coreCategory ) => {
			if (
				! categoryOptions.find(
					( cat ) =>
						cat.value === coreCategory.name ||
						cat.label === coreCategory.label
				)
			) {
				categoryOptions.push( {
					label: coreCategory.label,
					value: coreCategory.name,
					taxonomyId: undefined,
					description: coreCategory.description,
				} );
			}
		} );

	categoryOptions
		.sort( ( a, b ) => a.label.localeCompare( b.label ) )
		.push( {
			value: '',
			label: __( 'Select a category' ),
			disabled: true,
		} );

	const onConvert = useCallback(
		async function ( reusableBlockTitle ) {
			let categoryId;
			const selectedCategory = categoryOptions.find(
				( cat ) => cat.value === categorySlug
			);
			if ( selectedCategory.taxonomyId ) {
				categoryId = selectedCategory.taxonomyId;
			} else {
				const newTerm = await findOrCreateTerm( selectedCategory );
				categoryId = newTerm.id;
			}
			try {
				await convertBlocksToReusable(
					clientIds,
					reusableBlockTitle,
					syncType,
					categoryId
				);
				createSuccessNotice(
					! syncType
						? sprintf(
								// translators: %s: the name the user has given to the pattern.
								__( 'Synced Pattern created: %s' ),
								reusableBlockTitle
						  )
						: sprintf(
								// translators: %s: the name the user has given to the pattern.
								__( 'Unsynced Pattern created: %s' ),
								reusableBlockTitle
						  ),
					{
						type: 'snackbar',
						id: 'convert-to-reusable-block-success',
					}
				);
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
					id: 'convert-to-reusable-block-error',
				} );
			}
		},
		[
			convertBlocksToReusable,
			clientIds,
			syncType,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	if ( ! canConvert ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<>
					<MenuItem
						icon={ symbol }
						onClick={ () => setIsModalOpen( true ) }
					>
						{ showRenameHint
							? __( 'Create pattern/reusable block' )
							: __( 'Create pattern' ) }
					</MenuItem>
					{ isModalOpen && (
						<Modal
							title={ __( 'Create pattern' ) }
							onRequestClose={ () => {
								setIsModalOpen( false );
								setTitle( '' );
							} }
							overlayClassName="reusable-blocks-menu-items__convert-modal"
						>
							<form
								onSubmit={ ( event ) => {
									event.preventDefault();
									onConvert( title );
									setIsModalOpen( false );
									setTitle( '' );
									onClose();
								} }
							>
								<VStack spacing="5">
									<ReusableBlocksRenameHint />
									<TextControl
										__nextHasNoMarginBottom
										label={ __( 'Name' ) }
										value={ title }
										onChange={ setTitle }
										placeholder={ __( 'My pattern' ) }
									/>
									<SelectControl
										label={ __( 'Category' ) }
										onChange={ setCategoryId }
										options={ categoryOptions }
										size="__unstable-large"
										value={ categoryId }
									/>
									<ToggleControl
										label={ __( 'Synced' ) }
										help={ __(
											'Editing the pattern will update it anywhere it is used.'
										) }
										checked={ ! syncType }
										onChange={ () => {
											setSyncType(
												! syncType
													? 'unsynced'
													: undefined
											);
										} }
									/>
									<HStack justify="right">
										<Button
											variant="tertiary"
											onClick={ () => {
												setIsModalOpen( false );
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
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}
