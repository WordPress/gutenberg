/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import QueryControls from '..';
import type { Category } from '../types';

const meta: ComponentMeta< typeof QueryControls > = {
	title: 'Components/QueryControls',
	component: QueryControls,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const DefaultTemplate: ComponentStory< typeof QueryControls > = ( props ) => {
	const [ ownNumberOfItems, setOwnNumberOfItems ] = useState( props.numberOfItems );
	const [ ownOrder, setOwnOrder ] = useState( props.order );
	const [ ownOrderBy, setOwnOrderBy ] = useState( props.orderBy );
	const [ ownSelectedAuthorId, setOwnSelectedAuthorId ] = useState( props.selectedAuthorId );
	const [ ownSelectedCategories, setOwnSelectedCategories ] = useState( props.selectedCategories );

	const onCategoryChange = ( tokens: Array< Category | string > ) => {
		const allCategories =	tokens?.map( ( token ) => {
				return typeof token === 'string'
					? ( props.categorySuggestions?.[ token ] as Category )
					: token;
			} )

			setOwnSelectedCategories( allCategories );
	};

	return <QueryControls { ...{
		...props,
		selectedCategories: ownSelectedCategories,
		onCategoryChange,
		onOrderChange: setOwnOrder,
		onOrderByChange: setOwnOrderBy,
		order: ownOrder,
		orderBy: ownOrderBy,
		selectedAuthorId: ownSelectedAuthorId,
		numberOfItems: ownNumberOfItems,
		onNumberOfItemsChange: setOwnNumberOfItems,
		onAuthorChange: ( newAuthor ) => {
			setOwnSelectedAuthorId( Number( newAuthor ) );
		},
	} } />;
};

export const Default: ComponentStory< typeof QueryControls > = DefaultTemplate.bind(
	{}
);
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
		},
		JavaScript: {
			id: 12,
			name: 'JavaScript',
		},
	},
	selectedCategories: [
		{
			id: 11,
			value: 'TypeScript',
		},
		{
			id: 12,
			value: 'JavaScript',
		},
	],
	numberOfItems: 5,
	order: 'desc',
	orderBy: 'date',
	selectedAuthorId: 1,
};

const SingleCategoryTemplate: ComponentStory< typeof QueryControls > = ( props ) => {
	const [ ownOrder, setOwnOrder ] = useState( props.order );
	const [ ownOrderBy, setOwnOrderBy ] = useState( props.orderBy );
	const [ ownSelectedCategoryId, setSelectedCategoryId ] = useState( props.selectedCategoryId );

	return <QueryControls { ...{
		...props,
		onCategoryChange: setSelectedCategoryId,
		onOrderByChange: setOwnOrderBy,
		onOrderChange: setOwnOrder,
		order: ownOrder,
		orderBy: ownOrderBy,
		selectedCategoryId: ownSelectedCategoryId,
	} } />;
};
export const SelectSingleCategory: ComponentStory< typeof QueryControls > =
	SingleCategoryTemplate.bind( {} );
SelectSingleCategory.args = {
	categoriesList: [
		{
			id: 11,
			name: 'TypeScript',
		},
		{
			id: 12,
			name: 'JavaScript',
		},
	],
	selectedCategoryId: 11,
};
