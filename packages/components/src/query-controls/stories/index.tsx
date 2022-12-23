/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import QueryControls from '..';

const meta: ComponentMeta< typeof QueryControls > = {
	title: 'Components/QueryControls',
	component: QueryControls,
	parameters: {
		controls: {
			expanded: true,
		},
	},
};
export default meta;

const Template: ComponentStory< typeof QueryControls > = ( props ) => {
	return <QueryControls { ...props } />;
};

const noop = () => {};
export const Default: ComponentStory< typeof QueryControls > = Template.bind(
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
			name: 'TypeScript',
		},
		{
			id: 12,
			name: 'JavaScript',
		},
	],
	numberOfItems: 5,
	onAuthorChange: noop,
	onCategoryChange: noop,
	onNumberOfItemsChange: noop,
	onOrderByChange: noop,
	onOrderChange: noop,
	order: 'desc',
	orderBy: 'date',
	selectedAuthorId: 1,
};

export const SelectSingleCategory: ComponentStory< typeof QueryControls > =
	Template.bind( {} );
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
	onCategoryChange: noop,
	selectedCategoryId: 11,
};
