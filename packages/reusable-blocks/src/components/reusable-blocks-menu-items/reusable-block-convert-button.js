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
} from '@wordpress/block-editor';
import { useCallback, useState } from '@wordpress/element';
import {
	MenuItem,
	Modal,
	Button,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { symbol } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store } from '../../store';

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
	const query = { per_page: -1, hide_empty: false, context: 'view' };

	const { records: categories } = useEntityRecords(
		'taxonomy',
		'wp_pattern',
		query
	);

	const [ syncType, setSyncType ] = useState( 'unsynced' );
	const [ categorySlug, setCategorySlug ] = useState( '' );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ title, setTitle ] = useState( '' );
	const { canConvert, corePatternCategories } = useSelect(
		( select ) => {
			const { canUser } = select( coreStore );
			const { getBlocksByClientId, canInsertBlockType, getSettings } =
				select( blockEditorStore );

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
				canInsertBlockType( 'core/block', rootClientId ) &&
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

			return {
				canConvert: _canConvert,
				corePatternCategories:
					getSettings().__experimentalBlockPatternCategories,
			};
		},
		[ clientIds ]
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
					sprintf(
						// translators: %s: The sync status of the block that is created.
						__( '%s created.' ),
						syncType === 'fully'
							? __( 'Synced Pattern' )
							: __( 'Unsynced Pattern' )
					),
					{
						type: 'snackbar',
					}
				);
			} catch ( error ) {
				createErrorNotice( error.message, {
					type: 'snackbar',
				} );
			}
		},
		[
			categoryOptions,
			categorySlug,
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
						onClick={ () => {
							setCategorySlug( '' );
							setIsModalOpen( true );
						} }
					>
						{ __( 'Create a Pattern' ) }
					</MenuItem>
					{ isModalOpen && (
						<Modal
							title={ __( 'Create a pattern' ) }
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
									<TextControl
										__nextHasNoMarginBottom
										label={ __( 'Name' ) }
										value={ title }
										onChange={ setTitle }
									/>
									<SelectControl
										label={ __( 'Category' ) }
										onChange={ setCategorySlug }
										options={ categoryOptions }
										size="__unstable-large"
										value={ categorySlug }
									/>

									<ToggleControl
										label={ __(
											'Keep all pattern instances in sync'
										) }
										help={ __(
											'Editing the original pattern will also update anywhere the pattern is used.'
										) }
										checked={ syncType === 'fully' }
										onChange={ () => {
											setSyncType(
												syncType === 'fully'
													? 'unsynced'
													: 'fully'
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
											{ __( 'Save' ) }
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
