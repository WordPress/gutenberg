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
import { LAYOUT_TABLE } from '../constants';

export const data = [
	{
		id: 1,
		title: 'Apollo',
		description: 'Apollo description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Not a planet',
	},
	{
		id: 2,
		title: 'Space',
		description: 'Space description',
		image: 'https://live.staticflickr.com/5678/21911065441_92e2d44708_b.jpg',
		type: 'Not a planet',
	},
	{
		id: 3,
		title: 'NASA',
		description: 'NASA photo',
		image: 'https://live.staticflickr.com/742/21712365770_8f70a2c91e_b.jpg',
		type: 'Not a planet',
	},
	{
		id: 4,
		title: 'Neptune',
		description: 'Neptune description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Ice giant',
	},
	{
		id: 5,
		title: 'Mercury',
		description: 'Mercury description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
	},
	{
		id: 6,
		title: 'Venus',
		description: 'Venus description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
	},
	{
		id: 7,
		title: 'Earth',
		description: 'Earth description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
	},
	{
		id: 8,
		title: 'Mars',
		description: 'Mars description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Terrestrial',
	},
	{
		id: 9,
		title: 'Jupiter',
		description: 'Jupiter description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Gas giant',
	},
	{
		id: 10,
		title: 'Saturn',
		description: 'Saturn description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Gas giant',
	},
	{
		id: 11,
		title: 'Uranus',
		description: 'Uranus description',
		image: 'https://live.staticflickr.com/5725/21726228300_51333bd62c_b.jpg',
		type: 'Ice giant',
	},
];

export const DEFAULT_VIEW = {
	type: LAYOUT_TABLE,
	search: '',
	page: 1,
	perPage: 10,
	hiddenFields: [ 'image', 'type' ],
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
		header: 'Image',
		id: 'image',
		render: ( { item } ) => {
			return (
				<img src={ item.image } alt="" style={ { width: '100%' } } />
			);
		},
		width: 50,
		enableSorting: false,
	},
	{
		header: 'Title',
		id: 'title',
		maxWidth: 400,
		enableHiding: false,
		isSearchField: true,
	},
	{
		header: 'Type',
		id: 'type',
		maxWidth: 400,
		enableHiding: false,
		type: 'enumeration',
		elements: [
			{ value: 'Not a planet', label: 'Not a planet' },
			{ value: 'Ice giant', label: 'Ice giant' },
			{ value: 'Terrestrial', label: 'Terrestrial' },
			{ value: 'Gas giant', label: 'Gas giant' },
		],
	},
	{
		header: 'Description',
		id: 'description',
		maxWidth: 200,
		enableSorting: false,
		isSearchField: true,
	},
];
