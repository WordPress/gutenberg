import invalidateAttachmentResolutions from '../invalidate-attachment-resolutions';

/**
 * Builds a registry stub whose `getCachedResolvers().getEntityRecords` returns
 * the supplied map, and records the invalidations.
 *
 * @param {Map|undefined} entityRecords Cached `getEntityRecords` resolutions.
 */
function createRegistry( entityRecords ) {
	const invalidateResolution = jest.fn();

	const registry = {
		select: () => ( {
			getCachedResolvers: () => ( { getEntityRecords: entityRecords } ),
		} ),
		dispatch: () => ( { invalidateResolution } ),
	};

	return { registry, invalidateResolution };
}

describe( 'invalidateAttachmentResolutions', () => {
	/**
	 * Clearing every `getEntityRecords` resolution would be simpler, but it would
	 * take unrelated entity types with it. Clearing one exact query would miss
	 * the paginated and filtered variants other components hold.
	 */
	it( 'clears every attachment query and nothing else', () => {
		const attachmentsPage1 = [ 'postType', 'attachment', { parent: 1 } ];
		const attachmentsPage2 = [
			'postType',
			'attachment',
			{ parent: 1, page: 2 },
		];
		const posts = [ 'postType', 'post', { per_page: 10 } ];

		const { registry, invalidateResolution } = createRegistry(
			new Map( [
				[ attachmentsPage1, {} ],
				[ attachmentsPage2, {} ],
				[ posts, {} ],
			] )
		);

		invalidateAttachmentResolutions( registry );

		expect( invalidateResolution ).toHaveBeenCalledTimes( 2 );
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentsPage1
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentsPage2
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecords',
			posts
		);
	} );

	it( 'does nothing when no queries have resolved', () => {
		const { registry, invalidateResolution } = createRegistry( undefined );

		invalidateAttachmentResolutions( registry );

		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );
} );
