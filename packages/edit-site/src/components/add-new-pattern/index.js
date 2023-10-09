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
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

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
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { CreatePatternModal } = unlock( editPatternsPrivateApis );

export default function AddNewPattern() {
	const history = useHistory();
	const { params } = useLocation();
	const [ showPatternModal, setShowPatternModal ] = useState( false );
	const [ showTemplatePartModal, setShowTemplatePartModal ] =
		useState( false );
	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme()?.is_block_theme;
	}, [] );
	const { createPatternFromFile } = unlock( useDispatch( patternsStore ) );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const patternUploadInputRef = useRef();
	const { patternCategories } = usePatternCategories();

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

	const controls = [
		{
			icon: symbol,
			onClick: () => setShowPatternModal( true ),
			title: __( 'Create pattern' ),
		},
	];

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
					if ( ! file ) return;
					try {
						const currentCategoryId =
							params.categoryType !== TEMPLATE_PART_POST_TYPE &&
							patternCategories.find(
								( category ) =>
									category.name === params.categoryId
							)?.id;
						const pattern = await createPatternFromFile(
							file,
							currentCategoryId
								? [ currentCategoryId ]
								: undefined
						);

						// Navigate to the All patterns category for the newly created pattern
						// if we're not on that page already.
						if ( ! currentCategoryId ) {
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
