/**
 * Internal dependencies
 */
import type { Guidelines, Revision } from './constants';

/**
 * Mock guidelines data for development.
 */
export const MOCK_GUIDELINES: Guidelines = {
	id: 1,
	status: 'published',
	guideline_categories: {
		site: {
			label: 'Site Context',
			guidelines:
				'This is a technology blog focused on web development best practices.',
		},
		copy: {
			label: 'Copy Guidelines',
			guidelines:
				'Use a professional yet approachable tone. Avoid jargon when possible.',
		},
		images: {
			label: 'Image Guidelines',
			guidelines:
				'Use high-resolution images. Prefer PNG for screenshots, WebP for photos.',
		},
		blocks: {},
		other: {
			label: 'Other Guidelines',
			guidelines: 'Follow SEO best practices for all published content.',
		},
	},
	date: '2026-01-15T10:30:00',
	modified: '2026-02-01T14:22:00',
	author: 1,
	author_name: 'Admin',
};

/**
 * Mock revisions data for development.
 */
export const MOCK_REVISIONS: Revision[] = [
	{
		id: 101,
		date: '2026-02-01T14:22:00',
		author_name: 'Filippo Di Trapani',
	},
	{
		id: 100,
		date: '2026-01-29T13:03:00',
		author_name: 'Cris Busquets',
	},
	{
		id: 99,
		date: '2026-01-22T14:22:00',
		author_name: 'Shaun Andrews',
	},
	{
		id: 98,
		date: '2026-01-14T17:28:00',
		author_name: 'Filippo Di Trapani',
	},
	{
		id: 97,
		date: '2026-01-08T19:13:00',
		author_name: 'Eduardo Villuendas',
	},
	{
		id: 96,
		date: '2026-01-04T13:15:00',
		author_name: 'Filippo Di Trapani',
	},
	{
		id: 95,
		date: '2025-12-29T08:04:00',
		author_name: 'Eduardo Villuendas',
	},
	{
		id: 94,
		date: '2025-12-21T20:13:00',
		author_name: 'Cris Busquets',
	},
	{
		id: 93,
		date: '2025-12-08T11:24:00',
		author_name: 'Cris Busquets',
	},
	{
		id: 92,
		date: '2025-11-14T10:13:00',
		author_name: 'Eduardo Villuendas',
	},
];

/**
 * Returns a paginated slice of mock revisions.
 *
 * @param page    The page number (1-indexed).
 * @param perPage Number of items per page.
 * @return Object with revisions array and pagination metadata.
 */
export function getMockRevisions(
	page: number = 1,
	perPage: number = 5
): {
	revisions: Revision[];
	totalItems: number;
	totalPages: number;
} {
	const totalItems = MOCK_REVISIONS.length;
	const totalPages = Math.ceil( totalItems / perPage );
	const offset = ( page - 1 ) * perPage;
	const revisions = MOCK_REVISIONS.slice( offset, offset + perPage );

	return { revisions, totalItems, totalPages };
}
