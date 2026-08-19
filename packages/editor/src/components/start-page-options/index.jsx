import {
	Flex,
	FlexItem,
	Modal,
	CheckboxControl,
	SearchControl,
} from '@wordpress/components';
import { Stack, Tabs } from '@wordpress/ui';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';
import {
	ATTACHMENT_POST_TYPE,
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../../store/constants';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { getPopulatedCategories, searchItems } = unlock(
	blockEditorPrivateApis
);

const ALL_PATTERNS_CATEGORY = {
	name: 'allPatterns',
	label: _x( 'All', 'patterns' ),
};

export function useStartPatterns() {
	// A pattern is a start pattern if it includes 'core/post-content' in its blockTypes,
	// and it has no postTypes declared and the current post type is page or if
	// the current post type is part of the postTypes declared.
	const { blockPatternsWithPostContentBlockType, postType } = useSelect(
		( select ) => {
			const { getPatternsByBlockTypes, getBlocksByName } =
				select( blockEditorStore );
			const { getCurrentPostType, getRenderingMode } =
				select( editorStore );
			const rootClientId =
				getRenderingMode() === 'post-only'
					? ''
					: getBlocksByName( 'core/post-content' )?.[ 0 ];
			return {
				blockPatternsWithPostContentBlockType: getPatternsByBlockTypes(
					'core/post-content',
					rootClientId
				),
				postType: getCurrentPostType(),
			};
		},
		[]
	);

	return useMemo( () => {
		if ( ! blockPatternsWithPostContentBlockType?.length ) {
			return [];
		}

		/*
		 * Filter patterns without postTypes declared if the current postType is page
		 * or patterns that declare the current postType in its post type array.
		 */
		return blockPatternsWithPostContentBlockType.filter( ( pattern ) => {
			return (
				( postType === 'page' && ! pattern.postTypes ) ||
				( Array.isArray( pattern.postTypes ) &&
					pattern.postTypes.includes( postType ) )
			);
		} );
	}, [ postType, blockPatternsWithPostContentBlockType ] );
}

function useStartPatternCategories( startPatterns ) {
	const { registeredCategories, userCategories } = useSelect( ( select ) => {
		const { getBlockPatternCategories, getUserPatternCategories } =
			select( coreStore );
		return {
			registeredCategories: getBlockPatternCategories(),
			userCategories: getUserPatternCategories(),
		};
	}, [] );

	return useMemo( () => {
		const allCategories = [ ...( registeredCategories ?? [] ) ];
		userCategories?.forEach( ( userCategory ) => {
			if (
				! allCategories.some(
					( { name } ) => name === userCategory.name
				)
			) {
				allCategories.push( userCategory );
			}
		} );

		const categories = getPopulatedCategories(
			startPatterns,
			allCategories
		);

		// Filtering is not useful when no start pattern belongs to a
		// registered category.
		if ( ! categories.some( ( { name } ) => name !== 'uncategorized' ) ) {
			return [];
		}

		return [ ALL_PATTERNS_CATEGORY, ...categories ];
	}, [ startPatterns, registeredCategories, userCategories ] );
}

function PatternSelection( { blockPatterns, onChoosePattern } ) {
	const { editEntityRecord } = useDispatch( coreStore );
	const { postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );

		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
		};
	}, [] );
	return (
		<BlockPatternsList
			blockPatterns={ blockPatterns }
			onClickPattern={ ( _pattern, blocks ) => {
				editEntityRecord( 'postType', postType, postId, {
					blocks,
					content: ( { blocks: blocksForSerialization = [] } ) =>
						__unstableSerializeAndClean( blocksForSerialization ),
				} );
				onChoosePattern();
			} }
		/>
	);
}

function StartPageOptionsModal( { onClose } ) {
	const [ showStartPatterns, setShowStartPatterns ] = useState( true );
	const [ selectedCategory, setSelectedCategory ] = useState(
		ALL_PATTERNS_CATEGORY.name
	);
	const [ searchValue, setSearchValue ] = useState( '' );
	const { set: setPreference } = useDispatch( preferencesStore );
	const startPatterns = useStartPatterns();
	const patternCategories = useStartPatternCategories( startPatterns );
	const hasCategories = patternCategories.length > 0;
	const hasStartPattern = startPatterns.length > 0;

	const filteredStartPatterns = useMemo( () => {
		let patterns = startPatterns;
		if (
			hasCategories &&
			selectedCategory !== ALL_PATTERNS_CATEGORY.name
		) {
			patterns = patterns.filter( ( pattern ) =>
				selectedCategory === 'uncategorized'
					? ! pattern.categories?.some( ( patternCategory ) =>
							patternCategories.some(
								( { name } ) => name === patternCategory
							)
					  )
					: pattern.categories?.includes( selectedCategory )
			);
		}
		if ( searchValue ) {
			patterns = searchItems( patterns, searchValue );
		}
		return patterns;
	}, [
		startPatterns,
		hasCategories,
		selectedCategory,
		patternCategories,
		searchValue,
	] );

	if ( ! hasStartPattern ) {
		return null;
	}

	function handleClose() {
		onClose();
		setPreference( 'core', 'enableChoosePatternModal', showStartPatterns );
	}

	return (
		<Modal
			className="editor-start-page-options__modal"
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ handleClose }
		>
			{ hasCategories ? (
				<Tabs.Root
					orientation="vertical"
					value={ selectedCategory }
					onValueChange={ setSelectedCategory }
				>
					<Stack
						direction="column"
						gap="lg"
						className="editor-start-page-options__sidebar"
					>
						<SearchControl
							onChange={ setSearchValue }
							value={ searchValue }
							label={ __( 'Search' ) }
							placeholder={ __( 'Search' ) }
						/>
						<Tabs.List>
							{ patternCategories.map( ( { name, label } ) => (
								<Tabs.Tab key={ name } value={ name }>
									{ label }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
					</Stack>
					{ patternCategories.map( ( { name } ) => (
						<Tabs.Panel
							key={ name }
							value={ name }
							tabIndex={ -1 }
							className="editor-start-page-options__modal-content has-pattern-categories"
						>
							<PatternSelection
								blockPatterns={ filteredStartPatterns }
								onChoosePattern={ handleClose }
							/>
						</Tabs.Panel>
					) ) }
				</Tabs.Root>
			) : (
				<div className="editor-start-page-options__modal-content">
					<PatternSelection
						blockPatterns={ filteredStartPatterns }
						onChoosePattern={ handleClose }
					/>
				</div>
			) }
			<Flex
				className="editor-start-page-options__modal__actions"
				justify="flex-start"
				expanded={ false }
			>
				<FlexItem>
					<CheckboxControl
						checked={ showStartPatterns }
						label={ __(
							'Always show starter patterns for new pages'
						) }
						onChange={ ( newValue ) => {
							setShowStartPatterns( newValue );
						} }
					/>
				</FlexItem>
			</Flex>
		</Modal>
	);
}

export default function StartPageOptions() {
	const [ isOpen, setIsOpen ] = useState( false );
	const { isEditedPostEmpty } = useSelect( editorStore );
	const { getEntityRecordNonTransientEdits } = useSelect( coreStore );
	const { isModalActive } = useSelect( interfaceStore );
	const { enabled, postType, postId } = useSelect( ( select ) => {
		const { getCurrentPostId, getCurrentPostType } = select( editorStore );
		const choosePatternModalEnabled = select( preferencesStore ).get(
			'core',
			'enableChoosePatternModal'
		);
		const currentPostType = getCurrentPostType();
		return {
			postType: currentPostType,
			postId: getCurrentPostId(),
			enabled:
				choosePatternModalEnabled &&
				ATTACHMENT_POST_TYPE !== currentPostType &&
				TEMPLATE_POST_TYPE !== currentPostType &&
				TEMPLATE_PART_POST_TYPE !== currentPostType,
		};
	}, [] );

	// Note: The `postId` ensures the effect re-runs when pages are switched without remounting the component.
	// Examples: changing pages in the List View, creating a new page via Command Palette.
	useEffect( () => {
		// Read non-transient edits directly. `isEditedPostDirty` /
		// `hasEditsForEntityRecord` also return true while the CRDT
		// sync manager's phantom save (fired off `receiveEntityRecords`
		// at boot) is in flight, which would suppress the modal.
		const hasEdits =
			Object.keys(
				getEntityRecordNonTransientEdits(
					'postType',
					postType,
					postId
				) ?? {}
			).length > 0;
		const isFreshPage = ! hasEdits && isEditedPostEmpty();
		// Prevents immediately opening when features is enabled via preferences modal.
		const isPreferencesModalActive = isModalActive( 'editor/preferences' );
		if ( ! enabled || ! isFreshPage || isPreferencesModalActive ) {
			return;
		}

		// Open the modal after the initial render for a new page.
		setIsOpen( true );
	}, [
		enabled,
		postType,
		postId,
		getEntityRecordNonTransientEdits,
		isEditedPostEmpty,
		isModalActive,
	] );

	if ( ! isOpen ) {
		return null;
	}

	return <StartPageOptionsModal onClose={ () => setIsOpen( false ) } />;
}
