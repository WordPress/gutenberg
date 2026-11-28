import { trash, image, Icon, category } from '@wordpress/icons';
import { Button, __experimentalText as WCText } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
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
	author: string;
	/**
	 * The id of the item this one orbits, or `null` for a root of the tree.
	 */
	parent: number | null;
	/**
	 * How deep the item sits in the tree: `0` for a root, `1` for its
	 * children, and so on.
	 */
	level: number;
};

/**
 * The lit and shaded colors of each space object, sampled from the photos the
 * stories showed before they drew the thumbnails.
 */
const SPACE_COLORS = {
	amalthea: [ '#d7d7d7', '#4b4b4b' ],
	ariel: [ '#8f8f8f', '#353535' ],
	callisto: [ '#6c553e', '#3b2e21' ],
	ceres: [ '#b0ada9', '#423d3a' ],
	charon: [ '#979796', '#535150' ],
	deimos: [ '#e2ded3', '#524f4a' ],
	dione: [ '#d4d4d4', '#5d5d5d' ],
	earth: [ '#b4cdf0', '#2b3f78' ],
	enceladus: [ '#e4e4e4', '#4a4a4a' ],
	europa: [ '#cbbfb4', '#36393b' ],
	ganymede: [ '#d4c1a8', '#413931' ],
	haumea: [ '#f9f9f9', '#2f2f2f' ],
	himalia: [ '#bababa', '#2f2f2f' ],
	iapetus: [ '#d2d2d2', '#4c4a48' ],
	io: [ '#e1ea94', '#827e40' ],
	jupiter: [ '#e2d4c9', '#524524' ],
	makemake: [ '#b7b7b7', '#2e2e2e' ],
	mars: [ '#e3c7ab', '#726251' ],
	mercury: [ '#a2a2a2', '#3a3a3a' ],
	mimas: [ '#b6b6b6', '#434343' ],
	miranda: [ '#c6c6ca', '#595a5c' ],
	moon: [ '#b8b8b8', '#414141' ],
	neptune: [ '#47a4f9', '#295789' ],
	nereid: [ '#a6a6a6', '#313131' ],
	oberon: [ '#c6c2bc', '#4f4c48' ],
	phobos: [ '#b3a69d', '#5d514a' ],
	pluto: [ '#e9decd', '#483c2f' ],
	proteus: [ '#8f93a0', '#313338' ],
	rhea: [ '#d1d1d1', '#5b5b5b' ],
	roguePlanet: [ '#b1d1ee', '#51595f' ],
	saturn: [ '#f2d392', '#7d4e2c' ],
	sun: [ '#f78f2c', '#dc4407' ],
	tethys: [ '#b2b2b2', '#464646' ],
	titan: [ '#efd983', '#6c6347' ],
	titania: [ '#bbbbbb', '#3a3a3a' ],
	triton: [ '#b1bca6', '#414337' ],
	umbriel: [ '#747474', '#383838' ],
	uranus: [ '#c0c0ba', '#313236' ],
	venus: [ '#b6b7b7', '#283242' ],
} as const;

/**
 * Returns an SVG data URI that draws a sphere in the colors of the space
 * object, so the stories show thumbnails without requesting an image.
 *
 * @param name Name of the space object.
 */
export function spaceImage( name: keyof typeof SPACE_COLORS ) {
	const [ lit, shaded ] = SPACE_COLORS[ name ];
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><defs><radialGradient id="sphere" cx="35%" cy="35%"><stop offset="0" stop-color="${ lit }"/><stop offset="1" stop-color="${ shaded }"/></radialGradient></defs><rect width="320" height="320" fill="#050505"/><circle cx="160" cy="160" r="110" fill="url(#sphere)"/></svg>`;
	return `data:image/svg+xml,${ encodeURIComponent( svg ) }`;
}

export const data: SpaceObject[] = [
	{
		id: 1,
		name: {
			title: 'Moon',
			description:
				"The Moon is Earth's only natural satellite, orbiting at an average distance of 384,400 kilometers with a synchronous rotation that leads to fixed lunar phases as seen from Earth. Its cratered surface and subtle glow define night skies, inspiring exploration missions and influencing tides and biological rhythms worldwide.",
		},
		image: spaceImage( 'moon' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Earth', 'Moon' ],
		satellites: 0,
		date: '2021-01-01',
		datetime: '2021-01-01T14:30:00Z',
		email: 'moon@example.com',
		author: 'lunarian_observer',
		parent: 14,
		level: 2,
	},
	{
		id: 2,
		name: {
			title: 'Io',
			description: 'Moon of Jupiter',
		},
		image: spaceImage( 'io' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2019-01-02',
		datetime: '2019-01-02T09:15:00Z',
		email: 'io@example.com',
		author: 'galilean_moon_enthusiast_supreme',
		parent: 16,
		level: 2,
	},
	{
		id: 3,
		name: {
			title: 'Europa',
			description: 'Moon of Jupiter',
		},
		image: spaceImage( 'europa' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2025-01-03',
		datetime: '2025-01-03T16:45:30Z',
		email: 'europa@example.com',
		author: 'icy_ocean_explorer',
		parent: 16,
		level: 2,
	},
	{
		id: 4,
		name: {
			title: 'Ganymede',
			description: 'Largest moon of Jupiter',
		},
		image: spaceImage( 'ganymede' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2022-01-04',
		datetime: '2022-01-04T12:30:00Z',
		email: 'ganymede@example.com',
		author: 'jovian_satellite_researcher',
		parent: 16,
		level: 2,
	},
	{
		id: 5,
		name: {
			title: 'Callisto',
			description: 'Outermost Galilean moon of Jupiter',
		},
		image: spaceImage( 'callisto' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2021-01-05',
		datetime: '2021-01-05T14:15:30Z',
		email: 'callisto@example.com',
		author: 'crater_cartography_specialist',
		parent: 16,
		level: 2,
	},
	{
		id: 6,
		name: {
			title: 'Amalthea',
			description: 'Small irregular moon of Jupiter',
		},
		image: spaceImage( 'amalthea' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2020-01-06',
		datetime: '2020-01-06T10:45:15Z',
		email: 'amalthea@example.com',
		author: 'astro_photographer',
		parent: 16,
		level: 2,
	},
	{
		id: 7,
		name: {
			title: 'Himalia',
			description: 'Largest irregular moon of Jupiter',
		},
		image: spaceImage( 'himalia' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Jupiter', 'Moon' ],
		satellites: 0,
		date: '2019-01-07',
		datetime: '2019-01-07T16:20:45Z',
		email: 'himalia@example.com',
		author: 'irregular_orbit_analyst',
		parent: 16,
		level: 2,
	},
	{
		id: 8,
		name: {
			title: 'Neptune',
			description: 'Ice giant in the Solar system',
		},
		image: spaceImage( 'neptune' ),
		type: 'Ice giant',
		isPlanet: true,
		categories: [ 'Ice giant', 'Planet', 'Solar system' ],
		satellites: 16,
		date: '2020-01-01',
		datetime: '2020-01-01T11:22:15Z',
		email: 'neptune@example.com',
		author: 'neptunian_dynamics_professor',
		parent: 38,
		level: 1,
	},
	{
		id: 9,
		name: {
			title: 'Triton',
			description: 'Largest moon of Neptune',
		},
		image: spaceImage( 'triton' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2021-02-01',
		datetime: '2021-02-01T11:30:00Z',
		email: 'triton@example.com',
		author: 'retrograde_orbit_specialist',
		parent: 8,
		level: 2,
	},
	{
		id: 10,
		name: {
			title: 'Nereid',
			description: 'Irregular moon of Neptune',
		},
		image: spaceImage( 'nereid' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2020-02-02',
		datetime: '2020-02-02T15:45:30Z',
		email: 'nereid@example.com',
		author: 'outer_solar_system_voyager_mission_director',
		parent: 8,
		level: 2,
	},
	{
		id: 11,
		name: {
			title: 'Proteus',
			description: 'Second-largest moon of Neptune',
		},
		image: spaceImage( 'proteus' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Neptune', 'Moon' ],
		satellites: 0,
		date: '2019-02-03',
		datetime: '2019-02-03T09:20:15Z',
		email: 'proteus@example.com',
		author: 'space_observer',
		parent: 8,
		level: 2,
	},
	{
		id: 12,
		name: {
			title: 'Mercury',
			description: 'Terrestrial planet in the Solar system',
		},
		image: spaceImage( 'mercury' ),
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02',
		datetime: '2020-01-02T13:05:45Z',
		email: 'mercury@example.com',
		author: 'solar_wind_scientist',
		parent: 38,
		level: 1,
	},
	{
		id: 13,
		name: {
			title: 'Venus',
			description: 'La planète Vénus',
		},
		image: spaceImage( 'venus' ),
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 0,
		date: '2020-01-02',
		datetime: '2020-01-02T08:30:12Z',
		email: 'venus@example.com',
		author: 'atmospheric_chemistry_expert',
		parent: 38,
		level: 1,
	},
	{
		id: 14,
		name: {
			title: 'Earth',
			description: 'Terrestrial planet in the Solar system',
		},
		image: spaceImage( 'earth' ),
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system', 'Earth' ],
		satellites: 1,
		date: '2023-01-03',
		datetime: '2023-01-03T18:15:30Z',
		email: 'earth@example.com',
		author: 'planetary_geologist',
		parent: 38,
		level: 1,
	},
	{
		id: 15,
		name: {
			title: 'Mars',
			description: 'Terrestrial planet in the Solar system',
		},
		image: spaceImage( 'mars' ),
		type: 'Terrestrial',
		isPlanet: true,
		categories: [ 'Terrestrial', 'Planet', 'Solar system' ],
		satellites: 2,
		date: '2020-01-01',
		datetime: '2020-01-01T20:45:00Z',
		email: 'mars@example.com',
		author: 'red_planet_explorer',
		parent: 38,
		level: 1,
	},
	{
		id: 16,
		name: {
			title: 'Jupiter',
			description: 'Gas giant in the Solar system',
		},
		image: spaceImage( 'jupiter' ),
		type: 'Gas giant',
		isPlanet: true,
		categories: [ 'Solar system', 'Planet', 'Gas giant' ],
		satellites: 97,
		date: '2017-01-01',
		datetime: '2017-01-01T00:01:00Z',
		email: 'jupiter@example.com',
		author: 'gas_giant_meteorologist',
		parent: 38,
		level: 1,
	},
	{
		id: 17,
		name: {
			title: 'Saturn',
			description: 'Gas giant in the Solar system',
		},
		image: spaceImage( 'saturn' ),
		type: 'Gas giant',
		isPlanet: true,
		categories: [ 'Gas giant', 'Solar system', 'Planet' ],
		satellites: 274,
		date: '2020-02-01',
		datetime: '2020-02-01T00:02:00Z',
		email: 'saturn@example.com',
		author: 'ring_system_analyst',
		parent: 38,
		level: 1,
	},
	{
		id: 18,
		name: {
			title: 'Uranus',
			description: 'Ice giant in the Solar system',
		},
		image: spaceImage( 'uranus' ),
		type: 'Ice giant',
		isPlanet: true,
		categories: [ 'Planet', 'Ice giant', 'Solar system' ],
		satellites: 28,
		date: '2020-03-01',
		datetime: '2020-03-01T10:15:20Z',
		email: 'uranus@example.com',
		author: 'axial_tilt_researcher',
		parent: 38,
		level: 1,
	},
	{
		id: 19,
		name: {
			title: 'TheRoguePlanetWithAVeryLongNameToTestTitleOverflow',
			description:
				'A long unbroken title, used to check that layouts overflow instead of breaking.',
		},
		image: spaceImage( 'roguePlanet' ),
		type: 'Rogue planet',
		isPlanet: true,
		categories: [ 'Planet', 'Rogue planet' ],
		satellites: 0,
		date: '2020-03-01',
		datetime: '2020-03-01T10:15:20Z',
		email: 'longunbrokentitle@example.com',
		author: 'author_handle_long_enough_to_test_overflow',
		parent: null,
		level: 0,
	},
	{
		id: 20,
		name: {
			title: 'Titan',
			description: 'Largest moon of Saturn',
		},
		image: spaceImage( 'titan' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2022-02-15',
		datetime: '2022-02-15T08:30:00Z',
		email: 'titan@example.com',
		author: 'saturn_system_researcher',
		parent: 17,
		level: 2,
	},
	{
		id: 21,
		name: {
			title: 'Enceladus',
			description: 'Icy moon of Saturn with geysers',
		},
		image: spaceImage( 'enceladus' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2023-03-20',
		datetime: '2023-03-20T11:45:00Z',
		email: 'enceladus@example.com',
		author: 'cryovolcanism_observer',
		parent: 17,
		level: 2,
	},
	{
		id: 22,
		name: {
			title: 'Mimas',
			description: 'Death Star moon of Saturn',
		},
		image: spaceImage( 'mimas' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2021-07-12',
		datetime: '2021-07-12T15:20:00Z',
		email: 'mimas@example.com',
		author: 'impact_crater_analyst',
		parent: 17,
		level: 2,
	},
	{
		id: 23,
		name: {
			title: 'Charon',
			description: 'Largest moon of Pluto',
		},
		image: spaceImage( 'charon' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Pluto', 'Moon' ],
		satellites: 0,
		date: '2020-09-25',
		datetime: '2020-09-25T13:15:00Z',
		email: 'charon@example.com',
		author: 'pluto_system_mapper',
		parent: 39,
		level: 2,
	},
	{
		id: 24,
		name: {
			title: 'Phobos',
			description: 'Larger moon of Mars',
		},
		image: spaceImage( 'phobos' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Mars', 'Moon' ],
		satellites: 0,
		date: '2019-06-14',
		datetime: '2019-06-14T07:45:00Z',
		email: 'phobos@example.com',
		author: 'martian_surface_cartographer',
		parent: 15,
		level: 2,
	},
	{
		id: 25,
		name: {
			title: 'Deimos',
			description: 'Smaller moon of Mars',
		},
		image: spaceImage( 'deimos' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Mars', 'Moon' ],
		satellites: 0,
		date: '2018-11-30',
		datetime: '2018-11-30T16:00:00Z',
		email: 'deimos@example.com',
		author: 'small_moon_surveyor',
		parent: 15,
		level: 2,
	},
	{
		id: 26,
		name: {
			title: 'Rhea',
			description: 'Second largest moon of Saturn',
		},
		image: spaceImage( 'rhea' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2022-08-19',
		datetime: '2022-08-19T10:30:00Z',
		email: 'rhea@example.com',
		author: 'saturn_geology_specialist',
		parent: 17,
		level: 2,
	},
	{
		id: 27,
		name: {
			title: 'Iapetus',
			description: 'Two-toned moon of Saturn',
		},
		image: spaceImage( 'iapetus' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2023-01-22',
		datetime: '2023-01-22T14:20:00Z',
		email: 'iapetus@example.com',
		author: 'two_tone_surface_expert',
		parent: 17,
		level: 2,
	},
	{
		id: 28,
		name: {
			title: 'Dione',
			description: 'Icy moon of Saturn',
		},
		image: spaceImage( 'dione' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2021-04-17',
		datetime: '2021-04-17T12:00:00Z',
		email: 'dione@example.com',
		author: 'icy_surface_geochemist',
		parent: 17,
		level: 2,
	},
	{
		id: 29,
		name: {
			title: 'Tethys',
			description: 'Mid-sized moon of Saturn',
		},
		image: spaceImage( 'tethys' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Saturn', 'Moon' ],
		satellites: 0,
		date: '2020-12-05',
		datetime: '2020-12-05T09:40:00Z',
		email: 'tethys@example.com',
		author: 'middle_satellite_researcher',
		parent: 17,
		level: 2,
	},
	{
		id: 30,
		name: {
			title: 'Miranda',
			description: 'Unusual moon of Uranus',
		},
		image: spaceImage( 'miranda' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Uranus', 'Moon' ],
		satellites: 0,
		date: '2024-02-28',
		datetime: '2024-02-28T11:15:00Z',
		email: 'miranda@example.com',
		author: 'uranian_moon_geologist',
		parent: 18,
		level: 2,
	},
	{
		id: 31,
		name: {
			title: 'Ariel',
			description: 'Brightest moon of Uranus',
		},
		image: spaceImage( 'ariel' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Uranus', 'Moon' ],
		satellites: 0,
		date: '2023-09-10',
		datetime: '2023-09-10T08:25:00Z',
		email: 'ariel@example.com',
		author: 'planetary_reflectance_specialist',
		parent: 18,
		level: 2,
	},
	{
		id: 32,
		name: {
			title: 'Umbriel',
			description: 'Dark moon of Uranus',
		},
		image: spaceImage( 'umbriel' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Uranus', 'Moon' ],
		satellites: 0,
		date: '2022-05-03',
		datetime: '2022-05-03T15:50:00Z',
		email: 'umbriel@example.com',
		author: 'dark_surface_researcher',
		parent: 18,
		level: 2,
	},
	{
		id: 33,
		name: {
			title: 'Titania',
			description: 'Largest moon of Uranus',
		},
		image: spaceImage( 'titania' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Uranus', 'Moon' ],
		satellites: 0,
		date: '2021-10-18',
		datetime: '2021-10-18T13:35:00Z',
		email: 'titania@example.com',
		author: 'uranian_system_surveyor',
		parent: 18,
		level: 2,
	},
	{
		id: 34,
		name: {
			title: 'Oberon',
			description: 'Outermost major moon of Uranus',
		},
		image: spaceImage( 'oberon' ),
		type: 'Satellite',
		isPlanet: false,
		categories: [ 'Solar system', 'Satellite', 'Uranus', 'Moon' ],
		satellites: 0,
		date: '2020-07-22',
		datetime: '2020-07-22T10:05:00Z',
		email: 'oberon@example.com',
		author: 'outer_uranian_orbitalist',
		parent: 18,
		level: 2,
	},
	{
		id: 35,
		name: {
			title: 'Ceres',
			description: 'Largest object in the asteroid belt',
		},
		image: spaceImage( 'ceres' ),
		type: 'Dwarf planet',
		isPlanet: false,
		categories: [ 'Solar system', 'Dwarf planet', 'Asteroid belt' ],
		satellites: 0,
		date: '2024-08-14',
		datetime: '2024-08-14T16:40:00Z',
		email: 'ceres@example.com',
		author: 'asteroid_belt_specialist',
		parent: 38,
		level: 1,
	},
	{
		id: 36,
		name: {
			title: 'Makemake',
			description: 'Reddish dwarf planet',
		},
		image: spaceImage( 'makemake' ),
		type: 'Dwarf planet',
		isPlanet: false,
		categories: [ 'Solar system', 'Dwarf planet', 'Trans-Neptunian' ],
		satellites: 1,
		date: '2022-03-29',
		datetime: '2022-03-29T12:55:00Z',
		email: 'makemake@example.com',
		author: 'trans_neptunian_researcher',
		parent: 38,
		level: 1,
	},
	{
		id: 37,
		name: {
			title: 'Haumea',
			description: 'Elongated dwarf planet',
		},
		image: spaceImage( 'haumea' ),
		type: 'Dwarf planet',
		isPlanet: false,
		categories: [ 'Solar system', 'Dwarf planet', 'Trans-Neptunian' ],
		satellites: 2,
		date: '2021-11-11',
		datetime: '2021-11-11T09:10:00Z',
		email: 'haumea@example.com',
		author: 'dwarf_planet_dynamics_specialist',
		parent: 38,
		level: 1,
	},
	{
		id: 38,
		name: {
			title: 'Sun',
			description: 'The star at the center of the Solar system',
		},
		image: spaceImage( 'sun' ),
		type: 'Star',
		isPlanet: false,
		categories: [ 'Solar system', 'Star' ],
		satellites: 8,
		date: '2021-08-21',
		datetime: '2021-08-21T09:00:00Z',
		email: 'sun@example.com',
		author: 'solar_wind_scientist',
		parent: null,
		level: 0,
	},
	{
		id: 39,
		name: {
			title: 'Pluto',
			description: 'Dwarf planet in the Kuiper belt',
		},
		image: spaceImage( 'pluto' ),
		type: 'Dwarf planet',
		isPlanet: false,
		categories: [ 'Solar system', 'Dwarf planet', 'Trans-Neptunian' ],
		satellites: 5,
		date: '2019-07-14',
		datetime: '2019-07-14T11:50:00Z',
		email: 'pluto@example.com',
		author: 'pluto_system_mapper',
		parent: 38,
		level: 1,
	},
];

export const actions: Action< SpaceObject >[] = [
	{
		id: 'delete',
		label: 'Delete',
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
				<Stack direction="column" gap="xl">
					<WCText>{ label }</WCText>
					<Stack direction="row" gap="sm" justify="right">
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
		id: 'view',
		label: 'View',
		isPrimary: true,
		callback: ( items ) => {
			const item = items[ 0 ];
			// eslint-disable-next-line no-alert
			alert(
				`View item: "${ item.name.title }"\n\n${ item.name.description }`
			);
		},
	},
];

export const fields: Field< SpaceObject >[] = [
	{
		label: 'Image',
		id: 'image',
		type: 'media',
		header: (
			<Stack direction="row" gap="xs" justify="start" align="center">
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
			{ value: 'Star', label: 'Star' },
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
			{
				value: 'Extreme Trans-Neptunian Scattered Disc Object',
				label: 'Extreme Trans-Neptunian Scattered Disc Object',
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
		label: 'Parent',
		id: 'parent',
		type: 'text',
		elements: data
			.filter( ( { id } ) =>
				data.some( ( { parent } ) => parent === id )
			)
			.map( ( { id, name } ) => ( { value: id, label: name.title } ) ),
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
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
			<Stack direction="row" gap="xs" justify="start" align="center">
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
			{
				value: 'Extreme Outer Solar System Trans-Neptunian Region',
				label: 'Extreme Outer Solar System Trans-Neptunian Region',
			},
		],
		type: 'array',
		enableGlobalSearch: true,
	},
	{
		label: 'Author',
		id: 'author',
		type: 'text',
		enableHiding: false,
		enableGlobalSearch: true,
		elements: [
			{ value: 'lunarian_observer', label: 'lunarian_observer' },
			{
				value: 'galilean_moon_enthusiast_supreme',
				label: 'galilean_moon_enthusiast_supreme',
			},
			{ value: 'icy_ocean_explorer', label: 'icy_ocean_explorer' },
			{
				value: 'jovian_satellite_researcher',
				label: 'jovian_satellite_researcher',
			},
			{
				value: 'crater_cartography_specialist',
				label: 'crater_cartography_specialist',
			},
			{ value: 'astro_photographer', label: 'astro_photographer' },
			{
				value: 'irregular_orbit_analyst',
				label: 'irregular_orbit_analyst',
			},
			{
				value: 'neptunian_dynamics_professor',
				label: 'neptunian_dynamics_professor',
			},
			{
				value: 'retrograde_orbit_specialist',
				label: 'retrograde_orbit_specialist',
			},
			{
				value: 'outer_solar_system_voyager_mission_director',
				label: 'outer_solar_system_voyager_mission_director',
			},
			{ value: 'space_observer', label: 'space_observer' },
			{ value: 'solar_wind_scientist', label: 'solar_wind_scientist' },
			{
				value: 'atmospheric_chemistry_expert',
				label: 'atmospheric_chemistry_expert',
			},
			{ value: 'planetary_geologist', label: 'planetary_geologist' },
			{ value: 'red_planet_explorer', label: 'red_planet_explorer' },
			{
				value: 'gas_giant_meteorologist',
				label: 'gas_giant_meteorologist',
			},
			{ value: 'ring_system_analyst', label: 'ring_system_analyst' },
			{ value: 'axial_tilt_researcher', label: 'axial_tilt_researcher' },
			{
				value: 'author_handle_long_enough_to_test_overflow',
				label: 'author_handle_long_enough_to_test_overflow',
			},
		],
		filterBy: {
			operators: [ 'isAny', 'isNone' ],
		},
	},
];
