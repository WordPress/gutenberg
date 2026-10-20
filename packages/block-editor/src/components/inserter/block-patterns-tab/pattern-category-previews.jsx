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
	Spinner,
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
	myPatternsCategory,
	starterPatternsCategory,
	otherCategoriesCategory,
	isInOtherCategories,
	INSERTER_PATTERN_TYPES,
} from './utils';

const noop = () => {};

export function PatternCategoryPreviews( {
	rootClientId,
	onInsert,
	onHover = noop,
	category,
	showTitlesAsTooltip,
} ) {
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

	const availableCategories = usePatternCategories(
		rootClientId,
		patternSourceFilter
	);
	const scrollContainerRef = useRef();
	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) => {
				if (
					isPatternFiltered(
						pattern,
						patternSourceFilter,
						patternSyncFilter
					)
				) {
					return false;
				}

				if ( category.name === allPatternsCategory.name ) {
					return true;
				}

				if (
					category.name === myPatternsCategory.name &&
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
		( value ) => {
			setPatternSyncFilter( value );
			changePage( 1 );
		},
		[ setPatternSyncFilter, changePage ]
	);
	const onSetPatternSourceFilter = useCallback(
		( value ) => {
			setPatternSourceFilter( value );
			changePage( 1 );
		},
		[ setPatternSourceFilter, changePage ]
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
						setPatternSyncFilter={ onSetPatternSyncFilter }
						setPatternSourceFilter={ onSetPatternSourceFilter }
						scrollContainerRef={ scrollContainerRef }
						category={ category }
					/>
				</HStack>
				{ ! currentCategoryPatterns.length && isLoading && <Spinner /> }
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
						patternFilter={ patternSourceFilter }
						pagingProps={ pagingProps }
					/>
				</>
			) }
		</>
	);
}
