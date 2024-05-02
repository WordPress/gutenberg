/**
 * WordPress dependencies
 */
import { DropdownMenu } from '@wordpress/components';
import { useState, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { plus, symbol, symbolFilled, upload } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	privateApis as editPatternsPrivateApis,
	store as patternsStore,
} from '@wordpress/patterns';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import CreateTemplatePartModal from '../create-template-part-modal';
import SidebarButton from '../sidebar-button';
import { unlock } from '../../lock-unlock';
import {
	PATTERN_TYPES,
	PATTERN_DEFAULT_CATEGORY,
	TEMPLATE_PART_POST_TYPE,
} from '../../utils/constants';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { CreatePatternModal, useAddPatternCategory } = unlock(
	editPatternsPrivateApis
);

export default function AddNewPattern() {
	const history = useHistory();
	const { params } = useLocation();
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );
	const { createPatternFromFile } = unlock( useDispatch( patternsStore ) );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const patternUploadInputRef = useRef();
	const isBlockBasedTheme = useSelect(
		( select ) => select( coreStore ).getCurrentTheme()?.is_block_theme,
		[]
	);

	function handleCreatePattern( { pattern, categoryId } ) {
		setShowPatternModal( false );

		history.push( {
			postId: pattern.id,
			postType: PATTERN_TYPES.user,
			categoryType: PATTERN_TYPES.theme,
			categoryId,
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

	controls.push( {
		icon: symbol,
		onClick: () => setShowPatternModal( true ),
		title: __( 'Create pattern' ),
	} );

	if ( isBlockBasedTheme ) {
		controls.push( {
			icon: symbolFilled,
			onClick: () => setShowTemplatePartModal( true ),
			title: __( 'Create template part' ),
		} );
	}

	controls.push( {
		icon: upload,
		onClick: () => {
			patternUploadInputRef.current.click();
		},
		title: __( 'Import pattern from JSON' ),
	} );

	const { categoryMap, findOrCreateTerm } = useAddPatternCategory();
	return (
		<>
			<DropdownMenu
				controls={ controls }
				toggleProps={ {
					as: SidebarButton,
				} }
				icon={ plus }
				label={ __( 'Create pattern' ) }
			/>
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
						let currentCategoryId;
						// When we're not handling template parts, we should
						// add or create the proper pattern category.
						if ( params.categoryType !== TEMPLATE_PART_POST_TYPE ) {
							const currentCategory = categoryMap
								.values()
								.find(
									( term ) => term.name === params.categoryId
								);
							if ( !! currentCategory ) {
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
							params.categoryId !== 'my-patterns'
						) {
							history.push( {
								path: `/patterns`,
								categoryType: PATTERN_TYPES.theme,
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
