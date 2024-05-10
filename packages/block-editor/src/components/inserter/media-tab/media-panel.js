/**
 * WordPress dependencies
 */
import {
	Spinner,
	SearchControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalHeading as Heading,
	FlexBlock,
	__experimentalNavigatorBackButton as NavigatorBackButton,
} from '@wordpress/components';
import { __, isRTL } from '@wordpress/i18n';
import { useDebouncedInput } from '@wordpress/compose';
import { chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaList from './media-list';
import { useMediaResults } from './hooks';
import InserterNoResults from '../no-results';

const INITIAL_MEDIA_ITEMS_PER_PAGE = 10;

export function MediaCategoryPanel( { rootClientId, onInsert, category } ) {
	const [ search, setSearch, debouncedSearch ] = useDebouncedInput();
	const { mediaList, isLoading } = useMediaResults( category, {
		per_page: !! debouncedSearch ? 20 : INITIAL_MEDIA_ITEMS_PER_PAGE,
		search: debouncedSearch,
	} );
	const baseCssClass = 'block-editor-inserter__media-panel';
	const searchLabel = category.labels.search_items || __( 'Search' );
	return (
		<VStack className={ baseCssClass }>
			<HStack>
				<NavigatorBackButton
					style={
						// TODO: This style override is also used in ToolsPanelHeader.
						// It should be supported out-of-the-box by Button.
						{ minWidth: 24, padding: 0 }
					}
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
					label={ __( 'Back' ) }
				/>
				<FlexBlock>
					<Heading level={ 4 } as="div">
						{ category.label }
					</Heading>
				</FlexBlock>
			</HStack>
			<SearchControl
				className={ `${ baseCssClass }-search` }
				onChange={ setSearch }
				value={ search }
				label={ searchLabel }
				placeholder={ searchLabel }
			/>
			{ isLoading && (
				<div className={ `${ baseCssClass }-spinner` }>
					<Spinner />
				</div>
			) }
			{ ! isLoading && ! mediaList?.length && <InserterNoResults /> }
			{ ! isLoading && !! mediaList?.length && (
				<MediaList
					rootClientId={ rootClientId }
					onClick={ onInsert }
					mediaList={ mediaList }
					category={ category }
				/>
			) }
		</VStack>
	);
}
