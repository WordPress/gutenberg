/**
 * WordPress dependencies
 */
import { trash, image, Icon, category } from '@wordpress/icons';
import { Button, __experimentalText as Text } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { Field, Action } from '../../types';

export type SpaceObject = {
	id: number;
	name: {
		title: string;
		description: string;
	};
	image: string;
	type: string;
	isPlanet: boolean;
	categories: string[];
	satellites: number;
	date: string;
	datetime: string;
	email: string;
};

export const data: SpaceObject[] = [
	{
		id: 1,
		name: {
			title: 'Moon',
			description:
				"The Moon is Earth's only natural satellite, orbiting at an average distance of 384,400 kilometers with a synchronous rotation that leads to fixed lunar phases as seen from Earth. Its cratered surface and subtle glow define night skies, inspiring exploration missions and influencing tides and biological rhythms worldwide.",
		},
		image: 'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Earth', 'Moon' ],
		satellites: 0,
		date: '2021-01-01',
		datetime: '2021-01-01T14:30:00Z',
		email: 'moon@example.com',
	},
	{
		id: 2,
		name: {
			title: 'Io',
			description: 'Moon of Jupiter',
		},
		image: 'https://live.staticflickr.com/5482/9460973502_07e8ab81fe_z.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2019-01-02',
		datetime: '2019-01-02T09:15:00Z',
		email: 'io@example.com',
	},
	{
		id: 3,
		name: {
			title: 'Europa',
			description: 'Moon of Jupiter',
		},
		image: 'https://live.staticflickr.com/65535/31499273012_baf5f38cc1_z.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2025-01-03',
		datetime: '2025-01-03T16:45:30Z',
		email: 'europa@example.com',
	},
	{
		id: 4,
		name: {
			title: 'Ganymede',
			description: 'Largest moon of Jupiter',
		},
		image: 'https://live.staticflickr.com/7816/33436473218_a836235935_k.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2022-01-04',
		datetime: '2022-01-04T12:30:00Z',
		email: 'ganymede@example.com',
	},
	{
		id: 5,
		name: {
			title: 'Callisto',
			description: 'Outermost Galilean moon of Jupiter',
		},
		image: 'https://live.staticflickr.com/804/27604150528_4512448a9c_c.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2021-01-05',
		datetime: '2021-01-05T14:15:30Z',
		email: 'callisto@example.com',
	},
	{
		id: 6,
		name: {
			title: 'Amalthea',
			description: 'Small irregular moon of Jupiter',
		},
		image: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Amalthea.gif',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2020-01-06',
		datetime: '2020-01-06T10:45:15Z',
		email: 'amalthea@example.com',
	},
	{
		id: 7,
		name: {
			title: 'Himalia',
			description: 'Largest irregular moon of Jupiter',
		},
		image: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Cassini-Huygens_Image_of_Himalia.png',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2019-01-07',
		datetime: '2019-01-07T16:20:45Z',
		email: 'himalia@example.com',
	},
	{
		id: 8,
		name: {
			title: 'Neptune',
			description: 'Ice giant in the Solar system',
		},
		image: 'https://live.staticflickr.com/65535/29523683990_000ff4720c_z.jpg',
		type: 'Ice giant',
		isPlanet: true,
		categories: [ 'Ice giant', 'Planet', 'Solar system' ],
		satellites: 16,
		date: '2020-01-01',
		datetime: '2020-01-01T11:22:15Z',
		email: 'neptune@example.com',
	},
	{
		id: 9,
		name: {
			title: 'Triton',
			description: 'Largest moon of Neptune',
		},
		image: 'https://live.staticflickr.com/65535/50728384241_02c5126c30_h.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2021-02-01',
		datetime: '2021-02-01T11:30:00Z',
		email: 'triton@example.com',
	},
	{
		id: 10,
		name: {
			title: 'Nereid',
			description: 'Irregular moon of Neptune',
		},
		image: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Nereid-Voyager2.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2020-02-02',
		datetime: '2020-02-02T15:45:30Z',
		email: 'nereid@example.com',
	},
	{
		id: 11,
		name: {
			title: 'Proteus',
			description: 'Second-largest moon of Neptune',
		},
		image: 'https://live.staticflickr.com/65535/50727825808_bf427e007b_c.jpg',
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2019-02-03',
		datetime: '2019-02-03T09:20:15Z',
		email: 'proteus@example.com',
	},
	{
		id: 12,
		name: {
			title: 'Mercury',
			description: 'Terrestrial planet in the Solar system',
		},
		image: 'https://live.staticflickr.com/813/40199101735_e5e92ffd11_z.jpg',
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02',
		datetime: '2020-01-02T13:05:45Z',
		email: 'mercury@example.com',
	},
	{
		id: 13,
		name: {
			title: 'Venus',
			description: 'La planète Vénus',
		},
		image: 'https://live.staticflickr.com/8025/7544560662_900e717727_z.jpg',
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02',
		datetime: '2020-01-02T08:30:12Z',
		email: 'venus@example.com',
	},
	{
		id: 14,
		name: {
			title: 'Earth',
			description: 'Terrestrial planet in the Solar system',
		},
		image: 'https://live.staticflickr.com/3762/9460163562_964fe6af07_z.jpg',
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system', 'Earth' ],
		satellites: 1,
		date: '2023-01-03',
		datetime: '2023-01-03T18:15:30Z',
		email: 'earth@example.com',
	},
	{
		id: 15,
		name: {
			title: 'Mars',
			description: 'Terrestrial planet in the Solar system',
		},
		image: 'https://live.staticflickr.com/8151/7651156426_e047f4d219_z.jpg',
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 2,
		date: '2020-01-01',
		datetime: '2020-01-01T20:45:00Z',
		email: 'mars@example.com',
	},
	{
		id: 16,
		name: {
			title: 'Jupiter',
			description: 'Gas giant in the Solar system',
		},
		image: 'https://staging-jubilee.flickr.com/2853/9458010071_6e6fc41408_z.jpg',
		type: 'Gas giant',
		isPlanet: true,
		categories: [ 'Solar system', 'Planet', 'Gas giant' ],
		satellites: 97,
		date: '2017-01-01',
		datetime: '2017-01-01T00:01:00Z',
		email: 'jupiter@example.com',
	},
	{
		id: 17,
		name: {
			title: 'Saturn',
			description: 'Gas giant in the Solar system',
		},
		image: 'https://live.staticflickr.com/5524/9464658509_fc2d83dff5_z.jpg',
		type: 'Gas giant',
		isPlanet: true,
		categories: [ 'Gas giant', 'Solar system', 'Planet' ],
		satellites: 274,
		date: '2020-02-01',
		datetime: '2020-02-01T00:02:00Z',
		email: 'saturn@example.com',
	},
	{
		id: 18,
		name: {
			title: 'Uranus',
			description: 'Ice giant in the Solar system',
		},
		image: 'https://live.staticflickr.com/65535/5553350875_3072df91e2_c.jpg',
		type: 'Ice giant',
		isPlanet: true,
		categories: [ 'Planet', 'Ice giant', 'Solar system' ],
		satellites: 28,
		date: '2020-03-01',
		datetime: '2020-03-01T10:15:20Z',
		email: 'uranus@example.com',
	},
	{
		id: 19,
		name: {
			title: 'Thessalonikopolymnianebuchodonossarinacharybdis',
			description: 'Takes longer to say than to orbit.',
		},
		image: 'https://live.staticflickr.com/1357/935805705_119635028c_b.jpg',
		type: 'Rogue planet',
		isPlanet: true,
		categories: [ 'Planet', 'Rogue planet' ],
		satellites: 0,
		date: '2020-03-01',
		datetime: '2020-03-01T10:15:20Z',
		email: 'thessalonikopolymnianebuchodonossarinacharybdis@example.com',
	},
];

export const actions: Action< SpaceObject >[] = [
	{
		id: 'delete',
		label: 'Delete item',
		isPrimary: true,
		icon: trash,
		modalHeader: ( items ) =>
			items.length > 1
				? `Delete ${ items.length } items`
				: `Delete ${ items[ 0 ].name.title }`,
		modalFocusOnMount: 'firstContentElement',
		supportsBulk: true,
		RenderModal: ( { items, closeModal } ) => {
			const label =
				items.length > 1
					? `Are you sure you want to delete ${ items.length } items?`
					: `Are you sure you want to delete "${ items[ 0 ].name.title }"?`;
			return (
				<Stack direction="column" gap="lg">
					<Text>{ label }</Text>
					<Stack direction="row" gap="xs" justify="right">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ closeModal }
						>
							Cancel
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							onClick={ closeModal }
						>
							Delete
						</Button>
					</Stack>
				</Stack>
			);
		},
	},
	{
		id: 'secondary',
		label: 'Secondary action',
		callback() {
			// eslint-disable-next-line no-console
			console.log( 'Perform secondary action.' );
		},
	},
];

export const fields: Field< SpaceObject >[] = [
	{
		label: 'Image',
		id: 'image',
		type: 'media',
		header: (
			<Stack direction="row" gap="2xs" justify="start" align="center">
				<Icon icon={ image } />
				<span style={ { minWidth: 0 } }>Image</span>
			</Stack>
		),
		render: ( { item } ) => {
			return <img src={ item.image } alt="" />;
		},
	},
	{
		label: 'Title',
		id: 'title',
		type: 'text',
		enableHiding: true,
		enableGlobalSearch: true,
		filterBy: {
			operators: [ 'contains', 'notContains', 'startsWith' ],
		},
		isValid: {
			required: true,
		},
		getValue: ( { item } ) => item.name.title,
		setValue: ( { value } ) => ( {
			name: {
				title: value,
			},
		} ),
	},
	{
		id: 'date',
		label: 'Date',
		type: 'date',
	},
	{
		id: 'datetime',
		label: 'Datetime',
		type: 'datetime',
	},
	{
		label: 'Type',
		id: 'type',
		enableHiding: false,
		elements: [
			{ value: 'Satellite', label: 'Satellite' },
			{ value: 'Ice giant', label: 'Ice giant' },
			{ value: 'Terrestrial', label: 'Terrestrial' },
			{ value: 'Gas giant', label: 'Gas giant' },
			{ value: 'Dwarf planet', label: 'Dwarf planet' },
			{ value: 'Asteroid', label: 'Asteroid' },
			{ value: 'Comet', label: 'Comet' },
			{ value: 'Kuiper belt object', label: 'Kuiper belt object' },
			{ value: 'Protoplanet', label: 'Protoplanet' },
			{ value: 'Planetesimal', label: 'Planetesimal' },
			{ value: 'Minor planet', label: 'Minor planet' },
			{
				value: 'Trans-Neptunian object',
				label: 'Trans-Neptunian object',
			},
		],
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
	},
	{
		id: 'isPlanet',
		label: 'Is Planet',
		type: 'boolean',
		setValue: ( { value } ) => ( {
			isPlanet: value === 'true',
		} ),
		elements: [
			{ value: true, label: 'True' },
			{ value: false, label: 'False' },
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
		type: 'text',
		enableSorting: false,
		enableGlobalSearch: true,
		filterBy: {
			operators: [ 'contains', 'notContains', 'startsWith' ],
		},
		getValue: ( { item } ) => item.name.description,
		setValue: ( { value } ) => ( {
			name: {
				description: value,
			},
		} ),
	},
	{
		label: 'Email',
		id: 'email',
		type: 'email',
	},
	{
		label: 'Categories',
		id: 'categories',
		header: (
			<Stack direction="row" gap="2xs" justify="start" align="center">
				<Icon icon={ category } />
				<span style={ { minWidth: 0 } }>Categories</span>
			</Stack>
		),
		elements: [
			{ value: 'Solar system', label: 'Solar system' },
			{ value: 'Satellite', label: 'Satellite' },
			{ value: 'Moon', label: 'Moon' },
			{ value: 'Earth', label: 'Earth' },
			{ value: 'Jupiter', label: 'Jupiter' },
			{ value: 'Planet', label: 'Planet' },
			{ value: 'Ice giant', label: 'Ice giant' },
			{ value: 'Terrestrial', label: 'Terrestrial' },
			{ value: 'Gas giant', label: 'Gas giant' },
		],
		type: 'array',
		enableGlobalSearch: true,
	},
];
