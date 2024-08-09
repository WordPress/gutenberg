/**
 * WordPress dependencies
 */
import { trash } from '@wordpress/icons';
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { LAYOUT_TABLE } from '../../../constants';

export const data = [
	{
		id: 1,
		title: 'Apollo',
		description: 'Apollo description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Not a planet',
		categories: [ 'Space', 'NASA' ],
		satellites: 0,
		date: '2021-01-01T00:00:00Z',
	},
	{
		id: 2,
		title: 'Space',
		description: 'Space description',
		image: 'https://live.staticflickr.com/5678/21911065441_92e2d44708_b.jpg',
		type: 'Not a planet',
		categories: [ 'Space' ],
		satellites: 0,
		date: '2019-01-02T00:00:00Z',
	},
	{
		id: 3,
		title: 'NASA',
		description: 'NASA photo',
		image: 'https://live.staticflickr.com/742/21712365770_8f70a2c91e_b.jpg',
		type: 'Not a planet',
		categories: [ 'NASA' ],
		satellites: 0,
		date: '2025-01-03T00:00:00Z',
	},
	{
		id: 4,
		title: 'Neptune',
		description: 'Neptune description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Ice giant',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 14,
		date: '2020-01-01T00:00:00Z',
	},
	{
		id: 5,
		title: 'Mercury',
		description: 'Mercury description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02T01:00:00Z',
	},
	{
		id: 6,
		title: 'Venus',
		description: 'La planète Vénus',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02T00:00:00Z',
	},
	{
		id: 7,
		title: 'Earth',
		description: 'Earth description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 1,
		date: '2023-01-03T00:00:00Z',
	},
	{
		id: 8,
		title: 'Mars',
		description: 'Mars description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 2,
		date: '2020-01-01T00:00:00Z',
	},
	{
		id: 9,
		title: 'Jupiter',
		description: 'Jupiter description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Gas giant',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 95,
		date: '2017-01-01T00:01:00Z',
	},
	{
		id: 10,
		title: 'Saturn',
		description: 'Saturn description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Gas giant',
		categories: [ 'Space', 'Planet', 'Solar system' ],
		satellites: 146,
		date: '2020-02-01T00:02:00Z',
	},
	{
		id: 11,
		title: 'Uranus',
		description: 'Uranus description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Ice giant',
		categories: [ 'Space', 'Ice giant', 'Solar system' ],
		satellites: 28,
		date: '2020-03-01T00:00:00Z',
	},
];

export const DEFAULT_VIEW = {
	type: LAYOUT_TABLE,
	search: '',
	page: 1,
	perPage: 10,
	fields: [ 'title', 'description', 'categories' ],
	layout: {},
	filters: [],
};

export const actions = [
	{
		id: 'delete',
		label: 'Delete item',
		isPrimary: true,
		icon: trash,
		hideModalHeader: true,
		RenderModal: ( { item, closeModal } ) => {
			return (
				<VStack spacing="5">
					<Text>
						{ `Are you sure you want to delete "${ item.title }"?` }
					</Text>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ closeModal }>
							Cancel
						</Button>
						<Button variant="primary" onClick={ closeModal }>
							Delete
						</Button>
					</HStack>
				</VStack>
			);
		},
	},
	{
		id: 'secondary',
		label: 'Secondary action',
		callback() {},
	},
];

export const fields = [
	{
		label: 'Image',
		id: 'image',
		render: ( { item } ) => {
			return (
				<img src={ item.image } alt="" style={ { width: '100%' } } />
			);
		},
		enableSorting: false,
	},
	{
		label: 'Title',
		id: 'title',
		enableHiding: false,
		enableGlobalSearch: true,
	},
	{
		id: 'date',
		label: 'Date',
		type: 'datetime',
	},
	{
		label: 'Type',
		id: 'type',
		enableHiding: false,
		elements: [
			{ value: 'Not a planet', label: 'Not a planet' },
			{ value: 'Ice giant', label: 'Ice giant' },
			{ value: 'Terrestrial', label: 'Terrestrial' },
			{ value: 'Gas giant', label: 'Gas giant' },
		],
	},
	{
		label: 'Satellites',
		id: 'satellites',
		type: 'integer',
		enableSorting: true,
	},
	{
		label: 'Description',
		id: 'description',
		enableSorting: false,
		enableGlobalSearch: true,
	},
	{
		label: 'Categories',
		id: 'categories',
		elements: [
			{ value: 'Space', label: 'Space' },
			{ value: 'NASA', label: 'NASA' },
			{ value: 'Planet', label: 'Planet' },
			{ value: 'Solar system', label: 'Solar system' },
			{ value: 'Ice giant', label: 'Ice giant' },
		],
		filterBy: {
			operators: [ 'isAny', 'isNone', 'isAll', 'isNotAll' ],
		},
		getValue: ( { item } ) => {
			return item.categories;
		},
		render: ( { item } ) => {
			return item.categories.join( ',' );
		},
		enableSorting: false,
	},
];
