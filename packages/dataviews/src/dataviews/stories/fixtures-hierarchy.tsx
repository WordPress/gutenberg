import type { Field } from '../../types';

export type CelestialBody = {
	id: string;
	title: string;
	type: 'Star' | 'Planet' | 'Moon';
	image: string;
	/**
	 * The id of the item this one orbits, or `null` for the root of the tree.
	 */
	parent: string | null;
	/**
	 * How deep the item sits in the tree: `0` for the root, `1` for its
	 * children, and so on.
	 */
	level: number;
};

/**
 * A flat list, the way a database or a REST endpoint returns it: every item
 * points at its parent, and the list itself is in no particular order
 * (alphabetical here). Turning it into a tree is the consumer's job.
 */
export const hierarchicalData: CelestialBody[] = [
	{
		id: 'callisto',
		title: 'Callisto',
		type: 'Moon',
		image: 'https://live.staticflickr.com/804/27604150528_4512448a9c_c.jpg',
		parent: 'jupiter',
		level: 2,
	},
	{
		id: 'deimos',
		title: 'Deimos',
		type: 'Moon',
		image: 'https://upload.wikimedia.org/wikipedia/commons/8/86/NASA-Deimos-MarsMoon-20090221.jpg',
		parent: 'mars',
		level: 2,
	},
	{
		id: 'earth',
		title: 'Earth',
		type: 'Planet',
		image: 'https://live.staticflickr.com/3762/9460163562_964fe6af07_z.jpg',
		parent: 'sun',
		level: 1,
	},
	{
		id: 'enceladus',
		title: 'Enceladus',
		type: 'Moon',
		image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/PIA17202_-_Approaching_Enceladus.jpg/960px-PIA17202_-_Approaching_Enceladus.jpg',
		parent: 'saturn',
		level: 2,
	},
	{
		id: 'europa',
		title: 'Europa',
		type: 'Moon',
		image: 'https://live.staticflickr.com/65535/31499273012_baf5f38cc1_z.jpg',
		parent: 'jupiter',
		level: 2,
	},
	{
		id: 'ganymede',
		title: 'Ganymede',
		type: 'Moon',
		image: 'https://live.staticflickr.com/7816/33436473218_a836235935_k.jpg',
		parent: 'jupiter',
		level: 2,
	},
	{
		id: 'io',
		title: 'Io',
		type: 'Moon',
		image: 'https://live.staticflickr.com/5482/9460973502_07e8ab81fe_z.jpg',
		parent: 'jupiter',
		level: 2,
	},
	{
		id: 'jupiter',
		title: 'Jupiter',
		type: 'Planet',
		image: 'https://staging-jubilee.flickr.com/2853/9458010071_6e6fc41408_z.jpg',
		parent: 'sun',
		level: 1,
	},
	{
		id: 'mars',
		title: 'Mars',
		type: 'Planet',
		image: 'https://live.staticflickr.com/8151/7651156426_e047f4d219_z.jpg',
		parent: 'sun',
		level: 1,
	},
	{
		id: 'moon',
		title: 'Moon',
		type: 'Moon',
		image: 'https://live.staticflickr.com/7398/9458193857_e1256123e3_z.jpg',
		parent: 'earth',
		level: 2,
	},
	{
		id: 'neptune',
		title: 'Neptune',
		type: 'Planet',
		image: 'https://live.staticflickr.com/65535/29523683990_000ff4720c_z.jpg',
		parent: 'sun',
		level: 1,
	},
	{
		id: 'phobos',
		title: 'Phobos',
		type: 'Moon',
		image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Phobos_colour_2008.jpg/960px-Phobos_colour_2008.jpg',
		parent: 'mars',
		level: 2,
	},
	{
		id: 'saturn',
		title: 'Saturn',
		type: 'Planet',
		image: 'https://live.staticflickr.com/5524/9464658509_fc2d83dff5_z.jpg',
		parent: 'sun',
		level: 1,
	},
	{
		id: 'sun',
		title: 'Sun',
		type: 'Star',
		image: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
		parent: null,
		level: 0,
	},
	{
		id: 'titan',
		title: 'Titan',
		type: 'Moon',
		image: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Titan_in_true_color_by_Kevin_M._Gill.jpg',
		parent: 'saturn',
		level: 2,
	},
	{
		id: 'triton',
		title: 'Triton',
		type: 'Moon',
		image: 'https://live.staticflickr.com/65535/50728384241_02c5126c30_h.jpg',
		parent: 'neptune',
		level: 2,
	},
];

const titleById = new Map(
	hierarchicalData.map( ( item ) => [ item.id, item.title ] )
);

export const hierarchicalFields: Field< CelestialBody >[] = [
	{
		id: 'image',
		label: 'Image',
		type: 'media',
		render: ( { item } ) => <img src={ item.image } alt="" />,
	},
	{
		id: 'title',
		label: 'Title',
		type: 'text',
		enableGlobalSearch: true,
	},
	{
		id: 'type',
		label: 'Type',
		type: 'text',
		elements: [
			{ value: 'Star', label: 'Star' },
			{ value: 'Planet', label: 'Planet' },
			{ value: 'Moon', label: 'Moon' },
		],
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
	},
	{
		id: 'parent',
		label: 'Parent',
		type: 'text',
		getValue: ( { item } ) =>
			item.parent === null ? '' : titleById.get( item.parent ) ?? '',
	},
];
