/**
 * WordPress dependencies
 */
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
	__experimentalText as Text,
	FlexBlock,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import usePatternsState from '../hooks/use-patterns-state';
import BlockPatternsList from '../../block-patterns-list';
import usePatternsPaging from '../hooks/use-patterns-paging';
import { PatternsFilter } from './patterns-filter';
import { usePatternCategories } from './use-pattern-categories';
import {
	isPatternFiltered,
	allPatternsCategory,
	myPatternsCategory,
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
	const [ allPatterns, , onClickPattern ] = usePatternsState(
		onInsert,
		rootClientId
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

				if ( category.name === 'uncategorized' ) {
					// The uncategorized category should show all the patterns without any category...
					if ( ! pattern.categories ) {
						return true;
					}

					// ...or with no available category.
					return ! pattern.categories.some( ( catName ) =>
						availableCategories.some( ( c ) => c.name === catName )
					);
				}

				return pattern.categories?.includes( category.name );
			} ),
		[
			allPatterns,
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
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
		<div className="block-editor-inserter__patterns-category-panel">
			<VStack
				spacing={ 2 }
				className="block-editor-inserter__patterns-category-panel-header"
			>
				<HStack>
					<FlexBlock>
						<Heading level={ 4 } as="div">
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
				{ ! currentCategoryPatterns.length && (
					<Text
						variant="muted"
						className="block-editor-inserter__patterns-category-no-results"
					>
						{ __( 'No results found' ) }
					</Text>
				) }
			</VStack>

			{ currentCategoryPatterns.length > 0 && (
				<BlockPatternsList
					ref={ scrollContainerRef }
					shownPatterns={ pagingProps.categoryPatternsAsyncList }
					blockPatterns={ pagingProps.categoryPatterns }
					onClickPattern={ ( pattern, blocks ) =>
						onClickPattern( pattern, blocks, category )
					}
					onHover={ onHover }
					label={ category.label }
					orientation="vertical"
					category={ category.name }
					isDraggable
					showTitlesAsTooltip={ showTitlesAsTooltip }
					patternFilter={ patternSourceFilter }
					pagingProps={ pagingProps }
				/>
			) }
		</div>
	);
}
