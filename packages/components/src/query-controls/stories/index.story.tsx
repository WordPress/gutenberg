/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import QueryControls from '..';
import type {
	Category,
	QueryControlsWithSingleCategorySelectionProps,
	QueryControlsWithMultipleCategorySelectionProps,
} from '../types';

const meta: Meta< typeof QueryControls > = {
	title: 'Components/QueryControls',
	component: QueryControls,
	argTypes: {
		numberOfItems: { control: { type: null } },
		order: { control: { type: null } },
		orderBy: { control: { type: null } },
		selectedAuthorId: { control: { type: null } },
		selectedCategories: { control: { type: null } },
		selectedCategoryId: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryFn< typeof QueryControls > = ( args ) => {
	const {
		onAuthorChange,
		onCategoryChange,
		onNumberOfItemsChange,
		onOrderByChange,
		onOrderChange,
		...props
	} = args as QueryControlsWithMultipleCategorySelectionProps;
	const [ ownNumberOfItems, setOwnNumberOfItems ] = useState(
		props.numberOfItems
	);
	const [ ownOrder, setOwnOrder ] = useState( props.order );
	const [ ownOrderBy, setOwnOrderBy ] = useState( props.orderBy );
	const [ ownSelectedAuthorId, setOwnSelectedAuthorId ] = useState(
		props.selectedAuthorId
	);
	const [ ownSelectedCategories, setOwnSelectedCategories ] = useState(
		props.selectedCategories
	);

	const handleCategoryChange: QueryControlsWithMultipleCategorySelectionProps[ 'onCategoryChange' ] =
		( tokens ) => {
			onCategoryChange?.( tokens );

			const hasNoSuggestion = tokens.some(
				( token ) =>
					typeof token === 'string' &&
					! props.categorySuggestions?.[ token ]
			);
			if ( hasNoSuggestion ) {
				return;
			}
			const allCategories = tokens
				.map( ( token ) => {
					return typeof token === 'string'
						? props.categorySuggestions?.[ token ]
						: token;
				} )
				.filter( Boolean ) as Array< Required< Category > >;

			setOwnSelectedCategories( allCategories );
		};

	return (
		<QueryControls
			{ ...props }
			numberOfItems={ ownNumberOfItems }
			onCategoryChange={ handleCategoryChange }
			onOrderByChange={ ( newOrderBy ) => {
				onOrderByChange?.( newOrderBy );
				setOwnOrderBy( newOrderBy );
			} }
			onOrderChange={ ( newOrder ) => {
				onOrderChange?.( newOrder );
				setOwnOrder( newOrder );
			} }
			order={ ownOrder }
			orderBy={ ownOrderBy }
			onNumberOfItemsChange={ ( newNumber ) => {
				onNumberOfItemsChange?.( newNumber );
				setOwnNumberOfItems( newNumber );
			} }
			onAuthorChange={ ( newAuthor ) => {
				onAuthorChange?.( newAuthor );
				setOwnSelectedAuthorId( Number( newAuthor ) );
			} }
			selectedAuthorId={ ownSelectedAuthorId }
			selectedCategories={ ownSelectedCategories }
		/>
	);
};

Default.args = {
	authorList: [
		{
			id: 1,
			name: 'admin',
		},
		{
			id: 2,
			name: 'editor',
		},
	],
	categorySuggestions: {
		TypeScript: {
			id: 11,
			name: 'TypeScript',
			parent: 0,
		},
		JavaScript: {
			id: 12,
			name: 'JavaScript',
			parent: 0,
		},
	},
	selectedCategories: [
		{
			id: 11,
			name: 'JavaScript',
			parent: 0,
		},
	],
	numberOfItems: 5,
	order: 'desc',
	orderBy: 'date',
	selectedAuthorId: 1,
};

const SingleCategoryTemplate: StoryFn< typeof QueryControls > = ( args ) => {
	const {
		onAuthorChange,
		onCategoryChange,
		onNumberOfItemsChange,
		onOrderByChange,
		onOrderChange,
		...props
	} = args as QueryControlsWithSingleCategorySelectionProps;
	const [ ownOrder, setOwnOrder ] = useState( props.order );
	const [ ownOrderBy, setOwnOrderBy ] = useState( props.orderBy );
	const [ ownSelectedCategoryId, setSelectedCategoryId ] = useState(
		props.selectedCategoryId
	);

	const handleCategoryChange: QueryControlsWithSingleCategorySelectionProps[ 'onCategoryChange' ] =
		( newCategory ) => {
			onCategoryChange?.( newCategory );
			setSelectedCategoryId( Number( newCategory ) );
		};

	return (
		<QueryControls
			{ ...props }
			onCategoryChange={ handleCategoryChange }
			onOrderByChange={ ( newOrderBy ) => {
				setOwnOrderBy( newOrderBy );
			} }
			onOrderChange={ ( newOrder ) => {
				onOrderChange?.( newOrder );
				setOwnOrder( newOrder );
			} }
			order={ ownOrder }
			orderBy={ ownOrderBy }
			selectedCategoryId={ ownSelectedCategoryId }
		/>
	);
};
export const SelectSingleCategory = SingleCategoryTemplate.bind( {} );
SelectSingleCategory.args = {
	categoriesList: [
		{
			id: 11,
			name: 'TypeScript',
			parent: 0,
		},
		{
			id: 12,
			name: 'JavaScript',
			parent: 0,
		},
	],
	selectedCategoryId: 11,
};
