/**
 * Internal dependencies
 */
import { invalidateAttachmentResolutions } from '../invalidate-attachment-resolutions';

type Registry = Parameters< typeof invalidateAttachmentResolutions >[ 0 ];

/**
 * Builds a minimal registry stub whose `getCachedResolvers().getEntityRecords`
 * returns the supplied map, and captures the `invalidateResolution` calls.
 *
 * @param entityRecords The cached `getEntityRecords` resolutions (or undefined).
 */
function createRegistryStub(
	entityRecords: Map< unknown[], { status: string } > | undefined
) {
	const invalidateResolution = jest.fn();
	const registry = {
		select: () => ( {
			getCachedResolvers: () => ( { getEntityRecords: entityRecords } ),
		} ),
		dispatch: () => ( { invalidateResolution } ),
	} as unknown as Registry;

	return { registry, invalidateResolution };
}

describe( 'invalidateAttachmentResolutions', () => {
	it( 'invalidates only the postType/attachment getEntityRecords resolutions', () => {
		const attachmentPage1 = [ 'postType', 'attachment', { parent: 1 } ];
		const attachmentPage2 = [
			'postType',
			'attachment',
			{ parent: 1, page: 2 },
		];
		const postQuery = [ 'postType', 'post', { per_page: 10 } ];
		const rootMediaQuery = [ 'root', 'media', {} ];

		const { registry, invalidateResolution } = createRegistryStub(
			new Map( [
				[ attachmentPage1, { status: 'finished' } ],
				[ attachmentPage2, { status: 'finished' } ],
				[ postQuery, { status: 'finished' } ],
				[ rootMediaQuery, { status: 'finished' } ],
			] )
		);

		invalidateAttachmentResolutions( registry );

		// Both attachment queries (including the paginated one) are invalidated,
		// with their exact args, and nothing else is touched.
		expect( invalidateResolution ).toHaveBeenCalledTimes( 2 );
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentPage1
		);
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			attachmentPage2
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecords',
			postQuery
		);
		expect( invalidateResolution ).not.toHaveBeenCalledWith(
			'getEntityRecords',
			rootMediaQuery
		);
	} );

	it( 'does nothing when there are no cached getEntityRecords resolutions', () => {
		const { registry, invalidateResolution } =
			createRegistryStub( undefined );

		invalidateAttachmentResolutions( registry );

		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );
} );
