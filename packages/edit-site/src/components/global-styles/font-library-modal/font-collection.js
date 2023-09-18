/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState, useMemo } from '@wordpress/element';
import {
	__experimentalSpacer as Spacer,
	__experimentalInputControl as InputControl,
	__experimentalText as Text,
	SelectControl,
	Spinner,
	Icon,
	FlexItem,
	Flex,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { search, closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabLayout from './tab-layout';
import { FontLibraryContext } from './context';
import FontsGrid from './fonts-grid';
import FontCard from './font-card';
import filterFonts from './utils/filter-fonts';

const DEFAULT_CATEGORY = {
	id: 'all',
	name: __( 'All' ),
};

function FontCollection( { id } ) {
	const [ filters, setFilters ] = useState( {} );
	const { collections, getFontCollection } = useContext( FontLibraryContext );
	const selectedCollection = collections.find(
		( collection ) => collection.id === id
	);

	useEffect( () => {
		getFontCollection( id );
		resetFilters();
	}, [ id, getFontCollection ] );

	const collectionFonts = useMemo(
		() => selectedCollection?.data?.fontFamilies ?? [],
		[ selectedCollection ]
	);
	const collectionCategories = selectedCollection?.data?.categories ?? [];

	const categories = [ DEFAULT_CATEGORY, ...collectionCategories ];

	const fonts = useMemo(
		() => filterFonts( collectionFonts, filters ),
		[ collectionFonts, filters ]
	);

	const handleCategoryFilter = ( category ) => {
		setFilters( { ...filters, category } );
	};

	const handleUpdateSearchInput = ( value ) => {
		setFilters( { ...filters, search: value } );
	};

	const debouncedUpdateSearchInput = debounce( handleUpdateSearchInput, 300 );

	const resetFilters = () => {
		setFilters( {} );
	};

	const resetSearch = () => {
		setFilters( { ...filters, search: '' } );
	};

	return (
		<TabLayout
			title={ selectedCollection.name }
			description={ selectedCollection.description }
		>
			{ ! selectedCollection.data && <Spinner /> }

			<Flex>
				<FlexItem>
					<InputControl
						value={ filters.search }
						placeholder={ __( 'Font name…' ) }
						label={ __( 'Search' ) }
						onChange={ debouncedUpdateSearchInput }
						prefix={ <Icon icon={ search } /> }
						suffix={
							filters?.search ? (
								<Icon
									icon={ closeSmall }
									onClick={ resetSearch }
								/>
							) : null
						}
					/>
				</FlexItem>
				<FlexItem>
					<SelectControl
						label={ __( 'Category' ) }
						value={ filters.category }
						onChange={ handleCategoryFilter }
					>
						{ categories &&
							categories.map( ( category ) => (
								<option
									value={ category.id }
									key={ category.id }
								>
									{ category.name }
								</option>
							) ) }
					</SelectControl>
				</FlexItem>
			</Flex>

			<Spacer margin={ 4 } />

			{ ! selectedCollection?.data?.fontFamilies && <Spinner /> }

			{ !! selectedCollection?.data?.fontFamilies?.length &&
				! fonts.length && (
					<Text>
						{ __(
							'No fonts found. Try with a different seach term'
						) }
					</Text>
				) }

			<FontsGrid>
				{ fonts.map( ( font ) => (
					<FontCard
						key={ font.slug }
						font={ font }
						onClick={ () => {} }
					/>
				) ) }
			</FontsGrid>
		</TabLayout>
	);
}

export default FontCollection;
