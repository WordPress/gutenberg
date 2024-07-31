/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { symbol, symbolFilled, upload } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	privateApis as editPatternsPrivateApis,
	store as patternsStore,
} from '@wordpress/patterns';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const { useHistory } = unlock( routerPrivateApis );
const { CreatePatternModal, useAddPatternCategory } = unlock(
	editPatternsPrivateApis
);
const { CreateTemplatePartModal } = unlock( editorPrivateApis );

export default function AddNewPattern() {
	const history = useHistory();
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { createPatternFromFile } = unlock( useDispatch( patternsStore ) );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const patternUploadInputRef = useRef();
	const {
		isBlockBasedTheme,
		addNewPatternLabel,
		addNewTemplatePartLabel,
		canCreatePattern,
		canCreateTemplatePart,
	} = useSelect( ( select ) => {
		const { getCurrentTheme, getPostType, canUser } = select( coreStore );
		return {
			isBlockBasedTheme: getCurrentTheme()?.is_block_theme,
			addNewPatternLabel: getPostType( PATTERN_TYPES.user )?.labels
				?.add_new_item,
			addNewTemplatePartLabel: getPostType( TEMPLATE_PART_POST_TYPE )
				?.labels?.add_new_item,
			// Blocks refers to the wp_block post type, this checks the ability to create a post of that type.
			canCreatePattern: canUser( 'create', {
				kind: 'postType',
				name: PATTERN_TYPES.user,
			} ),
			canCreateTemplatePart: canUser( 'create', {
				kind: 'postType',
				name: TEMPLATE_PART_POST_TYPE,
			} ),
		};
	}, [] );

	function handleCreatePattern( { pattern } ) {
		setShowPatternModal( false );

		history.push( {
			postId: pattern.id,
			postType: PATTERN_TYPES.user,
			canvas: 'edit',
		} );
	}

	function handleCreateTemplatePart( templatePart ) {
		setShowTemplatePartModal( false );

		// Navigate to the created template part editor.
		history.push( {
			postId: templatePart.id,
			postType: TEMPLATE_PART_POST_TYPE,
			canvas: 'edit',
		} );
	}

	function handleError() {
		setShowPatternModal( false );
		setShowTemplatePartModal( false );
	}

	const controls = [];
	if ( canCreatePattern ) {
		controls.push( {
			icon: symbol,
			onClick: () => setShowPatternModal( true ),
			title: addNewPatternLabel,
		} );
	}

	if ( isBlockBasedTheme && canCreateTemplatePart ) {
		controls.push( {
			icon: symbolFilled,
			onClick: () => setShowTemplatePartModal( true ),
			title: addNewTemplatePartLabel,
		} );
	}

	if ( canCreatePattern ) {
		controls.push( {
			icon: upload,
			onClick: () => {
				patternUploadInputRef.current.click();
			},
			title: __( 'Import pattern from JSON' ),
		} );
	}

	const { categoryMap, findOrCreateTerm } = useAddPatternCategory();
	if ( controls.length === 0 ) {
		return null;
	}
	return (
		<>
			{ addNewPatternLabel && (
				<DropdownMenu
					controls={ controls }
					icon={ null }
					toggleProps={ {
						variant: 'primary',
						showTooltip: false,
						__next40pxDefaultSize: true,
					} }
					text={ addNewPatternLabel }
					label={ addNewPatternLabel }
				/>
			) }
			{ showPatternModal && (
				<CreatePatternModal
					onClose={ () => setShowPatternModal( false ) }
					onSuccess={ handleCreatePattern }
					onError={ handleError }
				/>
			) }
			{ showTemplatePartModal && (
				<CreateTemplatePartModal
					closeModal={ () => setShowTemplatePartModal( false ) }
					blocks={ [] }
					onCreate={ handleCreateTemplatePart }
					onError={ handleError }
				/>
			) }

			<input
				type="file"
				accept=".json"
				hidden
				ref={ patternUploadInputRef }
				onChange={ async ( event ) => {
					const file = event.target.files?.[ 0 ];
					if ( ! file ) {
						return;
					}
					try {
						const {
							params: { postType, categoryId },
						} = history.getLocationWithParams();
						let currentCategoryId;
						// When we're not handling template parts, we should
						// add or create the proper pattern category.
						if ( postType !== TEMPLATE_PART_POST_TYPE ) {
							/*
							 * categoryMap.values() returns an iterator.
							 * Iterator.prototype.find() is not yet widely supported.
							 * Convert to array to use the Array.prototype.find method.
							 */
							const currentCategory = Array.from(
								categoryMap.values()
							).find( ( term ) => term.name === categoryId );
							if ( currentCategory ) {
								currentCategoryId =
									currentCategory.id ||
									( await findOrCreateTerm(
										currentCategory.label
									) );
							}
						}
						const pattern = await createPatternFromFile(
							file,
							currentCategoryId
								? [ currentCategoryId ]
								: undefined
						);

						// Navigate to the All patterns category for the newly created pattern
						// if we're not on that page already and if we're not in the `my-patterns`
						// category.
						if (
							! currentCategoryId &&
							categoryId !== 'my-patterns'
						) {
							history.push( {
								postType: PATTERN_TYPES.user,
								categoryId: PATTERN_DEFAULT_CATEGORY,
							} );
						}

						createSuccessNotice(
							sprintf(
								// translators: %s: The imported pattern's title.
								__( 'Imported "%s" from JSON.' ),
								pattern.title.raw
							),
							{
								type: 'snackbar',
								id: 'import-pattern-success',
							}
						);
					} catch ( err ) {
						createErrorNotice( err.message, {
							type: 'snackbar',
							id: 'import-pattern-error',
						} );
					} finally {
						event.target.value = '';
					}
				} }
			/>
		</>
	);
}
