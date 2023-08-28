/**
 * WordPress dependencies
 */
import { useState, useDeferredValue, useId, useMemo } from '@wordpress/element';
import {
	SearchControl,
	__experimentalVStack as VStack,
	Flex,
	FlexBlock,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useAsyncList, useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PatternsHeader from './header';
import Grid from './grid';
import NoPatterns from './no-patterns';
import usePatterns from './use-patterns';
import SidebarButton from '../sidebar-button';
import useDebouncedInput from '../../utils/use-debounced-input';
import { unlock } from '../../lock-unlock';
import { SYNC_TYPES, USER_PATTERN_CATEGORY, PATTERNS } from './utils';
import Pagination from './pagination';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const SYNC_FILTERS = {
	all: __( 'All' ),
	[ SYNC_TYPES.full ]: __( 'Synced' ),
	[ SYNC_TYPES.unsynced ]: __( 'Standard' ),
};

const SYNC_DESCRIPTIONS = {
	all: '',
	[ SYNC_TYPES.full ]: __(
		'Patterns that are kept in sync across the site.'
	),
	[ SYNC_TYPES.unsynced ]: __(
		'Patterns that can be changed freely without affecting the site.'
	),
};

const PAGE_SIZE = 20;

export default function PatternsList( { categoryId, type } ) {
	const location = useLocation();
	const history = useHistory();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( '' );
	const deferredFilterValue = useDeferredValue( delayedFilterValue );

	const [ syncFilter, setSyncFilter ] = useState( 'all' );
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const deferredSyncedFilter = useDeferredValue( syncFilter );

	const isUncategorizedThemePatterns =
		type === PATTERNS && categoryId === 'uncategorized';

	const { patterns, isResolving } = usePatterns(
		type,
		isUncategorizedThemePatterns ? '' : categoryId,
		{
			search: deferredFilterValue,
			syncStatus:
				deferredSyncedFilter === 'all'
					? undefined
					: deferredSyncedFilter,
		}
	);

	const updateSearchFilter = ( value ) => {
		setCurrentPage( 1 );
		setFilterValue( value );
	};

	const updateSyncFilter = ( value ) => {
		setCurrentPage( 1 );
		setSyncFilter( value );
	};

	const id = useId();
	const titleId = `${ id }-title`;
	const descriptionId = `${ id }-description`;

	const hasPatterns = patterns.length;
	const title = SYNC_FILTERS[ syncFilter ];
	const description = SYNC_DESCRIPTIONS[ syncFilter ];

	const totalItems = patterns.length;
	const pageIndex = currentPage - 1;
	const numPages = Math.ceil( patterns.length / PAGE_SIZE );

	const list = useMemo( () => {
		return patterns.slice(
			pageIndex * PAGE_SIZE,
			pageIndex * PAGE_SIZE + PAGE_SIZE
		);
	}, [ pageIndex, patterns ] );

	const asyncList = useAsyncList( list, { step: 10 } );

	const changePage = ( page ) => {
		const scrollContainer = document.querySelector( '.edit-site-patterns' );
		scrollContainer?.scrollTo( 0, 0 );

		setCurrentPage( page );
	};

	return (
		<>
			<VStack className="edit-site-patterns__header" spacing={ 6 }>
				<PatternsHeader
					categoryId={ categoryId }
					type={ type }
					titleId={ titleId }
					descriptionId={ descriptionId }
				/>
				<Flex alignment="stretch" wrap>
					{ isMobileViewport && (
						<SidebarButton
							icon={ isRTL() ? chevronRight : chevronLeft }
							label={ __( 'Back' ) }
							onClick={ () => {
								// Go back in history if we came from the Patterns page.
								// Otherwise push a stack onto the history.
								if (
									location.state?.backPath === '/patterns'
								) {
									history.back();
								} else {
									history.push( { path: '/patterns' } );
								}
							} }
						/>
					) }
					<FlexBlock className="edit-site-patterns__search-block">
						<SearchControl
							className="edit-site-patterns__search"
							onChange={ ( value ) =>
								updateSearchFilter( value )
							}
							placeholder={ __( 'Search patterns' ) }
							label={ __( 'Search patterns' ) }
							value={ filterValue }
							__nextHasNoMarginBottom
						/>
					</FlexBlock>
					{ categoryId === USER_PATTERN_CATEGORY && (
						<ToggleGroupControl
							className="edit-site-patterns__sync-status-filter"
							hideLabelFromVision
							label={ __( 'Filter by sync status' ) }
							value={ syncFilter }
							isBlock
							onChange={ ( value ) => updateSyncFilter( value ) }
							__nextHasNoMarginBottom
						>
							{ Object.entries( SYNC_FILTERS ).map(
								( [ key, label ] ) => (
									<ToggleGroupControlOption
										className="edit-site-patterns__sync-status-filter-option"
										key={ key }
										value={ key }
										label={ label }
									/>
								)
							) }
						</ToggleGroupControl>
					) }
				</Flex>
			</VStack>
			<VStack
				className="edit-site-patterns__section"
				justify="flex-start"
				spacing={ 6 }
			>
				{ syncFilter !== 'all' && (
					<VStack className="edit-site-patterns__section-header">
						<Heading as="h3" level={ 5 } id={ titleId }>
							{ title }
						</Heading>
						{ description ? (
							<Text variant="muted" as="p" id={ descriptionId }>
								{ description }
							</Text>
						) : null }
					</VStack>
				) }
				{ hasPatterns && (
					<Grid
						categoryId={ categoryId }
						items={ asyncList }
						aria-labelledby={ titleId }
						aria-describedby={ descriptionId }
					/>
				) }
				{ ! isResolving && ! hasPatterns && <NoPatterns /> }
			</VStack>
			{ numPages > 1 && (
				<Pagination
					currentPage={ currentPage }
					numPages={ numPages }
					changePage={ changePage }
					totalItems={ totalItems }
				/>
			) }
		</>
	);
}
