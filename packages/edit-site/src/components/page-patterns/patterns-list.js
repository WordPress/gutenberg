/**
 * WordPress dependencies
 */
import { useState, useDeferredValue } from '@wordpress/element';
import {
	SearchControl,
	// __experimentalHeading as Heading,
	// __experimentalText as Text,
	__experimentalVStack as VStack,
	Flex,
	FlexBlock,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Grid from './grid';
import NoPatterns from './no-patterns';
import usePatterns from './use-patterns';
import SidebarButton from '../sidebar-button';
import useDebouncedInput from '../../utils/use-debounced-input';
import { unlock } from '../../lock-unlock';
import { SYNC_TYPES, USER_PATTERN_CATEGORY } from './utils';

const { useLocation, useHistory } = unlock( routerPrivateApis );

const SYNC_FILTERS = {
	all: __( 'All' ),
	[ SYNC_TYPES.full ]: __( 'Synced' ),
	[ SYNC_TYPES.unsynced ]: __( 'Standard' ),
};

export default function PatternsList( { categoryId, type } ) {
	const location = useLocation();
	const history = useHistory();
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const [ filterValue, setFilterValue, delayedFilterValue ] =
		useDebouncedInput( '' );
	const deferredFilterValue = useDeferredValue( delayedFilterValue );

	const [ syncFilter, setSyncFilter ] = useState( 'all' );
	const deferredSyncedFilter = useDeferredValue( syncFilter );
	const [ patterns, isResolving ] = usePatterns( type, categoryId, {
		filterValue: deferredFilterValue,
		syncFilter:
			deferredSyncedFilter === 'all' ? undefined : deferredSyncedFilter,
	} );

	const hasPatterns = patterns.length;

	return (
		<VStack spacing={ 6 }>
			{ /* <VStack className="edit-site-patterns__section-header">
				<Heading as="h2" level={ 4 }>
					{ __( 'Synced' ) }
				</Heading>
				<Text variant="muted" as="p">
					{ __( 'Patterns that are kept in sync across your site' ) }
				</Text>
			</VStack> */ }

			<Flex alignment="stretch" wrap>
				{ isMobileViewport && (
					<SidebarButton
						icon={ isRTL() ? chevronRight : chevronLeft }
						label={ __( 'Back' ) }
						onClick={ () => {
							// Go back in history if we came from the Patterns page.
							// Otherwise push a stack onto the history.
							if ( location.state?.backPath === '/patterns' ) {
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
						onChange={ ( value ) => setFilterValue( value ) }
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
						label={ __( 'Sync status filter' ) }
						value={ syncFilter }
						isBlock
						onChange={ ( value ) => setSyncFilter( value ) }
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

			{ isResolving && __( 'Loading' ) }
			{ ! isResolving && hasPatterns && (
				<Grid categoryId={ categoryId } items={ patterns } />
			) }
			{ ! isResolving && ! hasPatterns && <NoPatterns /> }
		</VStack>
	);
}
