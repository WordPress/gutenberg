/**
 * Internal dependencies
 */
import type { ActionButton, Field, View } from '../types';
import DataViewsPicker from '../components/dataviews-picker';
import { LAYOUT_PICKER_GRID, LAYOUT_PICKER_TABLE } from '../constants';

export default function Media() {
	type SpaceObject = {
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
	const view: View = {
		type: LAYOUT_PICKER_GRID,
		fields: [],
		titleField: 'title',
		mediaField: 'image',
		search: '',
		page: 1,
		perPage: 10,
		filters: [],
	};
	const onChangeView = () => {};
	const fields: Field< SpaceObject >[] = [
		{
			label: 'Image',
			id: 'image',
			type: 'media',
			render: ( { item } ) => {
				return (
					<img
						src={ item.image }
						alt=""
						style={ { width: '100%' } }
					/>
				);
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

	const actions: ActionButton< SpaceObject >[] = [];
	const selection: string[] = [];
	const onChangeSelection = () => {};
	const paginationInfo = {
		totalItems: 2,
		totalPages: 1,
	};
	const data: SpaceObject[] = [
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
	];
	const isLoading = false;

	return (
		<DataViewsPicker
			getItemId={ ( item ) => item.id.toString() }
			actions={ actions }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			paginationInfo={ paginationInfo }
			data={ data }
			isLoading={ isLoading }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			itemListLabel="Media"
			defaultLayouts={ {
				[ LAYOUT_PICKER_GRID ]: {},
				[ LAYOUT_PICKER_TABLE ]: { perPage: 20 },
			} }
		/>
	);
}
