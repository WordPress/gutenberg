/**
 * Returns the pagination metadata reported by a collection response. Endpoints
 * that don't paginate send no headers, in which case the totals are unknown.
 *
 * @param headers Response headers.
 */
export default function getPaginationMeta( headers: Headers ): {
	totalItems: number | null;
	totalPages: number | null;
} {
	const totalItems = parseInt( headers.get( 'X-WP-Total' ) ?? '' );
	const totalPages = parseInt( headers.get( 'X-WP-TotalPages' ) ?? '' );

	return {
		totalItems: Number.isFinite( totalItems ) ? totalItems : null,
		totalPages: Number.isFinite( totalPages ) ? totalPages : null,
	};
}
