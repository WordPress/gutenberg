import {
	useMemo,
	useState,
	useCallback,
	useRef,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	__experimentalText as WCText,
	FlexBlock,
	Spinner as WCSpinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import usePatternsState from '../hooks/use-patterns-state';
import BlockPatternsList from '../../block-patterns-list';
import usePatternsPaging from '../hooks/use-patterns-paging';
import { PatternsFilter } from './patterns-filter';
import { usePatternCategories } from './use-pattern-categories';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import {
	isPatternFiltered,
	allPatternsCategory,
	sitePatternsCategory,
	starterPatternsCategory,
	otherCategoriesCategory,
	isInOtherCategories,
	INSERTER_PATTERN_TYPES,
} from './utils';
import type { BlockPattern } from '../../../store/types';
import type { PatternCategoryPreviewsProps } from '../types';

const noop = () => {};

export function PatternCategoryPreviews( {
	rootClientId,
	onInsert,
	onHover = noop,
	category,
	showTitlesAsTooltip,
}: PatternCategoryPreviewsProps ) {
	const [ allPatterns, allCategories, onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId,
		category?.name
	);
	const isLoading = useSelect(
		( select ) =>
			unlock(
				select( blockEditorStore )
			).isLoadingInstalledThemePatterns(),
		[]
	);
	const [ patternSyncFilter, setPatternSyncFilter ] = useState( 'all' );
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );
	const [ patternAuthorFilter, setPatternAuthorFilter ] = useState( 'all' );

	// The author filter only applies while only user patterns are listed, so
	// it doesn't linger unseen in categories where it isn't shown.
	const isUserSource =
		category.name === sitePatternsCategory.name ||
		patternSourceFilter === INSERTER_PATTERN_TYPES.user;
	const currentPatternAuthorFilter = isUserSource
		? patternAuthorFilter
		: 'all';

	const availableCategories = usePatternCategories(
		rootClientId,
		patternSourceFilter
	);
	const scrollContainerRef = useRef< HTMLDivElement >( null );
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern: BlockPattern ) => {
				if (
					isPatternFiltered(
						pattern,
						patternSourceFilter,
						patternSyncFilter,
						currentPatternAuthorFilter
					)
				) {
					return false;
				}

				if ( category.name === allPatternsCategory.name ) {
					return true;
				}

				if (
					category.name === sitePatternsCategory.name &&
					pattern.type === INSERTER_PATTERN_TYPES.user
				) {
					return true;
				}

				if (
					category.name === starterPatternsCategory.name &&
					pattern.blockTypes?.includes( 'core/post-content' )
				) {
					return true;
				}

				if ( category.name === otherCategoriesCategory.name ) {
					return isInOtherCategories( pattern, allCategories );
				}

				if ( category.name === 'uncategorized' ) {
					// The uncategorized category should show all the patterns without any category...
					if ( ! pattern.categories ) {
						return true;
					}

					// ...or with no available category, unless they're in
					// "Other categories".
					return (
						! pattern.categories.some( ( catName ) =>
							availableCategories.some(
								( c ) => c.name === catName
							)
						) && ! isInOtherCategories( pattern, allCategories )
					);
				}

				return pattern.categories?.includes( category.name );
			} ),
		[
			allPatterns,
			allCategories,
			availableCategories,
			category.name,
			patternSourceFilter,
			patternSyncFilter,
			currentPatternAuthorFilter,
		]
	);

	const pagingProps = usePatternsPaging(
		currentCategoryPatterns,
		category,
		scrollContainerRef
	);
	const { changePage } = pagingProps;

	// Hide block pattern preview on unmount.
	useEffect( () => () => onHover( null ), [] );

	const onSetPatternSyncFilter = useCallback(
		( value: string ) => {
			setPatternSyncFilter( value );
			changePage( 1 );
		},
		[ setPatternSyncFilter, changePage ]
	);
	const onSetPatternSourceFilter = useCallback(
		( value: string ) => {
			setPatternSourceFilter( value );
			changePage( 1 );
		},
		[ setPatternSourceFilter, changePage ]
	);
	const onSetPatternAuthorFilter = useCallback(
		( value: string ) => {
			setPatternAuthorFilter( value );
			changePage( 1 );
		},
		[ setPatternAuthorFilter, changePage ]
	);

	return (
		<>
			<VStack
				spacing={ 2 }
				className="block-editor-inserter__patterns-category-panel-header"
			>
				<HStack>
					<FlexBlock>
						<Heading
							className="block-editor-inserter__patterns-category-panel-title"
							size={ 13 }
							level={ 4 }
							as="div"
						>
							{ category.label }
						</Heading>
					</FlexBlock>
					<PatternsFilter
						patternSyncFilter={ patternSyncFilter }
						patternSourceFilter={ patternSourceFilter }
						patternAuthorFilter={ currentPatternAuthorFilter }
						setPatternSyncFilter={ onSetPatternSyncFilter }
						setPatternSourceFilter={ onSetPatternSourceFilter }
						setPatternAuthorFilter={ onSetPatternAuthorFilter }
						scrollContainerRef={ scrollContainerRef }
						category={ category }
					/>
				</HStack>
				{ ! currentCategoryPatterns.length && isLoading && (
					<WCSpinner />
				) }
				{ ! currentCategoryPatterns.length && ! isLoading && (
					<WCText
						variant="muted"
						className="block-editor-inserter__patterns-category-no-results"
					>
						{ __( 'No results found' ) }
					</WCText>
				) }
			</VStack>
			{ currentCategoryPatterns.length > 0 && (
				<>
					<WCText
						size="12"
						as="p"
						className="block-editor-inserter__help-text"
					>
						{ __( 'Drag and drop patterns into the canvas.' ) }
					</WCText>
					<BlockPatternsList
						ref={ scrollContainerRef }
						blockPatterns={ pagingProps.categoryPatterns }
						onClickPattern={ onClickPattern }
						onHover={ onHover }
						label={ category.label }
						orientation="vertical"
						category={ category.name }
						isDraggable
						showTitlesAsTooltip={ showTitlesAsTooltip }
						// @ts-expect-error TODO: The list ignores `patternFilter`, so remove it.
						patternFilter={ patternSourceFilter }
						pagingProps={ pagingProps }
					/>
				</>
			) }
		</>
	);
}
