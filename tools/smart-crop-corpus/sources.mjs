/**
 * Corpus sources for the smart crop review harness.
 *
 * Every source is public, needs no authentication, and is fetched fresh on each
 * run so that a review never grades the same pictures twice. Nothing is checked
 * into the repository: a run produces a manifest of URLs plus the images it
 * downloaded, which keeps the licensing question where it belongs (with the
 * original hosts) and keeps the repository small.
 *
 * See https://github.com/WordPress/gutenberg/issues/81706 for the discussion of
 * what a representative corpus needs to contain.
 */

const USER_AGENT =
	'gutenberg-smart-crop-corpus (https://github.com/WordPress/gutenberg/issues/81706)';

const FETCH_ATTEMPTS = 3;
const FETCH_BACKOFF_MS = 500;

/**
 * What an image has to look like to be worth grading.
 *
 * A square crop keeps `short / long` of a source and throws the rest away, so
 * the shape of the input decides how much of the picture the crop is choosing
 * between. A 4:3 photo keeps 75% no matter which strategy runs, which leaves
 * little room for the two to disagree. Requiring a wider frame is what makes
 * the choice matter: at 3:2 the crop discards a third of the image, at 3:1 it
 * discards two thirds.
 *
 * The size floor is there so the crop is a real downscale rather than a
 * near-copy: a 250px crop out of a 1024px frame is choosing from four times its
 * own width.
 */
export const SHAPE = {
	minLongEdge: 1024,
	minShortEdge: 450,
	// 3:2, the commonest photographic frame, comes out at 1.4993 once a 1024px
	// rendition rounds its short edge. A floor of exactly 1.5 would reject the
	// whole shape by a rounding error.
	minAspect: 1.45,
};

/**
 * Whether an image is large enough and far enough from square.
 *
 * @param {number} width  Image width.
 * @param {number} height Image height.
 * @param {Object} shape  Constraints in the shape of `SHAPE`.
 * @return {boolean} True when the image is worth grading.
 */
export function hasUsableShape( width, height, shape = SHAPE ) {
	if ( ! width || ! height ) {
		return false;
	}

	const long = Math.max( width, height );
	const short = Math.min( width, height );

	return (
		long >= shape.minLongEdge &&
		short >= shape.minShortEdge &&
		long / short >= shape.minAspect
	);
}

/**
 * Photo Directory tags that name a single, findable subject.
 *
 * The first version of this harness sampled by category, and most of what came
 * back was landscape: the directory is 63% `nature`, and its categories name
 * scenes rather than things. A landscape has no focal point to miss, so centre
 * and attention agree and the comparison teaches nothing.
 *
 * Tags name objects instead. Every slug here is something that occupies part of
 * a frame and can be cropped off, which is the case the proposal is about.
 */
const PHOTO_SUBJECT_TAGS = [
	'bird',
	'cat',
	'dog',
	'insect',
	'butterfly',
	'bee',
	'wildlife',
	'statue',
	'sculpture',
	'boat',
	'car',
	'bicycle',
	'vehicle',
	'lighthouse',
	'tower',
	'mushroom',
	'door',
	'window',
	'sign',
	'hand',
	'eye',
	'hat',
	'people',
	'person',
	'portrait',
	'child',
];

/**
 * Fetches JSON with a descriptive user agent and a useful error on failure.
 *
 * @param {string} url       URL to fetch.
 * @param {Object} [options] Fetch options.
 * @param {number} [attempt] Which try this is.
 * @return {Promise<any>} Parsed JSON body.
 */
async function fetchJson( url, options = {}, attempt = 1 ) {
	// A hundred-image run makes a few hundred requests, at which point a
	// transient 502 from wordpress.org stops being unlikely. Retrying the ones
	// that can succeed on a second go keeps one bad response from costing the
	// whole source.
	const retry = async ( reason ) => {
		if ( attempt >= FETCH_ATTEMPTS ) {
			throw reason;
		}

		await new Promise( ( resolve ) =>
			setTimeout( resolve, FETCH_BACKOFF_MS * attempt )
		);

		return fetchJson( url, options, attempt + 1 );
	};

	let response;

	try {
		response = await fetch( url, {
			...options,
			headers: { 'user-agent': USER_AGENT, ...options.headers },
		} );
	} catch ( error ) {
		return retry( error );
	}

	if ( ! response.ok ) {
		const error = new Error(
			`Request failed (${ response.status } ${ response.statusText }): ${ url }`
		);

		return response.status >= 500
			? retry( error )
			: Promise.reject( error );
	}

	return {
		body: await response.json(),
		total: Number( response.headers.get( 'x-wp-total' ) ) || undefined,
	};
}

/**
 * Picks `count` items at random from a list, without replacement.
 *
 * @param {Array}    items List to sample from.
 * @param {number}   count How many to take.
 * @param {Function} rng   Random number generator returning 0..1.
 * @return {Array} The sample.
 */
function sample( items, count, rng ) {
	const pool = [ ...items ];
	const picked = [];

	while ( picked.length < count && pool.length > 0 ) {
		picked.push( pool.splice( Math.floor( rng() * pool.length ), 1 )[ 0 ] );
	}

	return picked;
}

/**
 * WordPress Photo Directory, sampled by subject tag.
 *
 * This is the closest public stand-in for "what people upload to WordPress",
 * and CC0 means there is no attribution burden on the harness. Sampling runs
 * through `PHOTO_SUBJECT_TAGS` so that what comes back has a subject in it
 * rather than a horizon.
 *
 * @param {number}   count Number of images to collect.
 * @param {Function} rng   Random number generator returning 0..1.
 * @param {Object}   shape Shape constraints, in the form of `SHAPE`.
 * @return {Promise<Array>} Corpus entries.
 */
async function fromPhotoDirectory( count, rng, shape ) {
	const base = 'https://wordpress.org/photos/wp-json/wp/v2';

	const { body: tags } = await fetchJson(
		`${ base }/photo-tags?slug=${ PHOTO_SUBJECT_TAGS.join(
			','
		) }&per_page=100&_fields=id,slug,count`
	);
	const usable = tags.filter( ( tag ) => tag.count > 0 );

	if ( ! usable.length ) {
		return [];
	}

	// Twice what is wanted, so the sort at the end has something to choose
	// between. Rejected candidates cost an API page, not a download, so this is
	// the cheapest place in the harness to be picky.
	const wanted = count * 2;
	const entries = [];
	const seen = new Set();
	let attempts = 0;

	// Each pass picks one tag at random and a random offset within it, so
	// consecutive runs land in completely different parts of the archive. Tags
	// are drawn uniformly rather than by size: weighting by count would turn the
	// run back into mostly birds.
	while ( entries.length < wanted && attempts < wanted * 6 ) {
		attempts++;

		const tag = usable[ Math.floor( rng() * usable.length ) ];
		const perPage = 20;
		const offset = Math.floor( rng() * Math.max( 1, tag.count - perPage ) );
		let photos;

		try {
			( { body: photos } = await fetchJson(
				`${ base }/photos?per_page=${ perPage }&offset=${ offset }` +
					`&photo-tags=${ tag.id }&_embed=wp:featuredmedia`
			) );
		} catch {
			// One bad page is not a reason to abandon the ones already
			// collected. Move on to a different tag and offset.
			continue;
		}

		// Six of twenty rather than one or two: a hundred-image run needs a few
		// hundred candidates, and taking more per page is far kinder to
		// wordpress.org than making three times as many requests.
		for ( const photo of sample( photos, 6, rng ) ) {
			if ( entries.length >= wanted ) {
				break;
			}

			const media = photo._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
			const details = media?.media_details;
			if ( ! media?.source_url || ! details?.width ) {
				continue;
			}

			// Prefer a large-but-not-enormous rendition. Originals run to 4000px
			// and 4MB, which slows a run down without changing what attention
			// picks. Anything at this size is still a realistic upload.
			const rendition =
				details.sizes?.[ '1536x1536' ] ||
				details.sizes?.[ '2048x2048' ] ||
				details.sizes?.large;

			const width = rendition?.width || details.width;
			const height = rendition?.height || details.height;

			// The directory publishes dimensions, so badly shaped photos are
			// dropped here rather than after downloading them.
			if ( ! hasUsableShape( width, height, shape ) ) {
				continue;
			}

			const url = rendition?.source_url || media.source_url;
			if ( seen.has( url ) ) {
				continue;
			}
			seen.add( url );

			entries.push( {
				id: `photo-${ photo.id }`,
				url,
				title: photo.title?.rendered?.trim() || `Photo ${ photo.id }`,
				pageUrl: photo.link,
				credit: media.author_name || 'WordPress Photo Directory',
				license: 'CC0',
				source: 'WordPress Photo Directory',
				subject: tag.slug,
				width,
				height,
			} );
		}
	}

	// Widest first, then take what was asked for. A wider frame is one where the
	// crop is choosing between more of the picture.
	const aspect = ( entry ) =>
		Math.max( entry.width, entry.height ) /
		Math.min( entry.width, entry.height );

	return entries
		.sort( ( a, b ) => aspect( b ) - aspect( a ) )
		.slice( 0, count );
}

/**
 * The Flickr cropping dataset: images chosen because cropping them is hard.
 *
 * 1,743 photographs, each with a rectangle drawn by an expert cropper. The
 * images were selected for a cropping benchmark, so unlike a directory sample
 * they all have something worth keeping in frame.
 *
 * The images are what this harness wants. The annotation is not: it is a
 * free-form aesthetic crop, and those come out centred - median centre 0.496
 * of the frame, half of them within 5% of the middle. Scoring against it asks
 * "is this point near the middle", which the centre strategy wins by
 * construction. The rectangle is carried into the manifest as reference data
 * and deliberately not scored.
 *
 * Only the URLs are used. Nothing from the dataset is vendored, and the images
 * stay on Flickr under their own terms.
 *
 * @see https://github.com/yiling-chen/flickr-cropping-dataset
 *
 * @param {number}   count Number of images to collect.
 * @param {Function} rng   Random number generator returning 0..1.
 * @return {Promise<Array>} Corpus entries.
 */
async function fromCroppingDataset( count, rng ) {
	const base =
		'https://raw.githubusercontent.com/yiling-chen/flickr-cropping-dataset/master';

	const sets = await Promise.all(
		[ 'cropping_testing_set.json', 'cropping_training_set.json' ].map(
			( file ) => fetchJson( `${ base }/${ file }` )
		)
	);
	const all = sets.flatMap( ( set ) => set.body || [] );

	return sample( all, count * 2, rng )
		.map( ( item ) => {
			const [ x, y, width, height ] = item.crop || [];
			if ( ! item.url || ! width || ! height ) {
				return null;
			}

			// The dataset links the 800px rendition for about half its entries.
			// Flickr serves a 1024px `_b` for most of those, which is the size
			// floor this harness wants; the linked URL stays as a fallback for
			// the ones where it does not exist.
			const large = item.url.replace( /_c\.jpg$/, '_b.jpg' );

			return {
				id: `crop-${ item.flickr_photo_id }`,
				url: large,
				fallbackUrl: large === item.url ? undefined : item.url,
				title: `Flickr ${ item.flickr_photo_id }`,
				pageUrl: `https://www.flickr.com/photo.gne?id=${ item.flickr_photo_id }`,
				credit: 'Flickr contributor',
				license: 'Referenced by URL; terms on the Flickr page',
				source: 'Flickr cropping dataset',
				subject: 'cropping benchmark',
				// Pixel coordinates in the linked rendition, which is what the
				// harness downloads. Normalised once the image is decoded.
				expertCrop: { x, y, width, height },
			};
		} )
		.filter( Boolean )
		.slice( 0, count );
}

/**
 * Theme directory screenshots.
 *
 * Screenshots are a common real-world upload and behave nothing like a
 * photograph: flat regions, dense text, and a subject that fills the frame.
 *
 * @param {number}   count Number of images to collect.
 * @param {Function} rng   Random number generator returning 0..1.
 * @return {Promise<Array>} Corpus entries.
 */
async function fromThemeScreenshots( count, rng ) {
	const perPage = 40;
	const page = 1 + Math.floor( rng() * 30 );
	const url =
		'https://api.wordpress.org/themes/info/1.2/?action=query_themes' +
		`&request[per_page]=${ perPage }&request[page]=${ page }` +
		'&request[browse]=popular';

	const { body } = await fetchJson( url );

	return sample( body.themes || [], count, rng )
		.filter( ( theme ) => theme.screenshot_url )
		.map( ( theme ) => ( {
			id: `theme-${ theme.slug }`,
			// The API returns protocol-relative URLs.
			url: theme.screenshot_url.replace( /^\/\//, 'https://' ),
			title: `${ theme.name } (theme screenshot)`,
			pageUrl: `https://wordpress.org/themes/${ theme.slug }/`,
			credit: theme.author?.display_name || theme.author?.user_nicename,
			license: 'GPL-compatible (theme directory requirement)',
			source: 'WordPress Theme Directory',
			subject: 'screenshot',
		} ) );
}

/**
 * Plugin directory banners.
 *
 * A 1544x500 banner is usually a logo or wordmark on a flat background, which
 * is the failure class called out in the issue: attention scoring has nothing
 * to latch onto, and a confidence signal needs to notice that.
 *
 * @param {number}   count Number of images to collect.
 * @param {Function} rng   Random number generator returning 0..1.
 * @return {Promise<Array>} Corpus entries.
 */
async function fromPluginBanners( count, rng ) {
	// Only a fraction of plugins publish a high-resolution banner, so a run
	// asking for a lot of them needs a page big enough to find them in.
	const perPage = Math.min( 100, Math.max( 40, count * 3 ) );
	const page = 1 + Math.floor( rng() * 60 );
	const url =
		'https://api.wordpress.org/plugins/info/1.2/?action=query_plugins' +
		`&request[per_page]=${ perPage }&request[page]=${ page }` +
		'&request[fields][banners]=1';

	const { body } = await fetchJson( url );

	return sample( body.plugins || [], count * 2, rng )
		.map( ( plugin ) => {
			// Only the 1544x500 banner is large enough to crop against the
			// target sizes; the 772x250 fallback is shorter than most of them.
			// The API returns `false` rather than omitting a missing banner.
			const banner = plugin.banners?.high;
			if (
				typeof banner !== 'string' ||
				! /^(https?:)?\/\//.test( banner )
			) {
				return null;
			}

			return {
				id: `plugin-${ plugin.slug }`,
				url: banner.replace( /^\/\//, 'https://' ),
				title: `${ plugin.name } (plugin banner)`,
				pageUrl: `https://wordpress.org/plugins/${ plugin.slug }/`,
				credit: plugin.author_profile || plugin.author,
				license:
					'Plugin author artwork; referenced by URL, not vendored',
				source: 'WordPress Plugin Directory',
				subject: 'logo-on-flat',
			};
		} )
		.filter( Boolean )
		.slice( 0, count );
}

export const SOURCES = {
	photos: {
		label: 'WordPress Photo Directory',
		collect: fromPhotoDirectory,
		// The only source that publishes dimensions, so it is the only one that
		// can be filtered and sorted for shape without downloading anything.
		// That makes it the cheapest place to get wide frames, so it carries
		// most of a run.
		share: 0.55,
	},
	plugins: {
		label: 'Plugin banners',
		collect: fromPluginBanners,
		// A 1544x500 banner discards two thirds of itself to a square crop,
		// which is the hardest shape in the mix. Held below the photo share so a
		// run does not turn into a wall of logos.
		share: 0.2,
	},
	cropping: {
		label: 'Flickr cropping dataset',
		collect: fromCroppingDataset,
		// Images picked for a cropping benchmark, so every one has a subject a
		// crop can cut off. Held to a small share because the set is mostly 4:3
		// and most of what it offers gets rejected for shape after downloading.
		share: 0.2,
	},
	themes: {
		label: 'Theme screenshots',
		collect: fromThemeScreenshots,
		// Screenshots are 1200x900 by convention, which is too close to square
		// to clear the default shape gate. Most of these get dropped; lower
		// `--min-aspect` to grade them.
		share: 0.05,
	},
};

/**
 * Deals entries out one source at a time.
 *
 * @param {Array} entries Entries grouped by source.
 * @return {Array} The same entries, round-robin by source.
 */
function interleave( entries ) {
	const groups = new Map();

	for ( const entry of entries ) {
		const group = groups.get( entry.source ) || [];
		group.push( entry );
		groups.set( entry.source, group );
	}

	const queues = [ ...groups.values() ];
	const out = [];

	while ( out.length < entries.length ) {
		for ( const queue of queues ) {
			if ( queue.length ) {
				out.push( queue.shift() );
			}
		}
	}

	return out;
}

/**
 * Builds a mixed corpus across the enabled sources.
 *
 * @param {Object}   options
 * @param {number}   options.count   Total number of images.
 * @param {string[]} options.sources Source keys to draw from.
 * @param {Object}   options.shape   Shape constraints, in the form of `SHAPE`.
 * @param {Function} options.rng     Random number generator returning 0..1.
 * @param {Function} options.onLog   Progress reporter.
 * @return {Promise<Array>} Corpus entries.
 */
export async function buildCorpus( {
	count,
	sources,
	shape = SHAPE,
	rng,
	onLog,
} ) {
	const enabled = sources.filter( ( key ) => SOURCES[ key ] );
	const totalShare = enabled.reduce(
		( sum, key ) => sum + SOURCES[ key ].share,
		0
	);

	const collected = [];

	for ( const key of enabled ) {
		const source = SOURCES[ key ];
		// Strictly by share. Letting the last source absorb whatever the others
		// came up short by means one failing source silently rewrites the mix,
		// and the source that ends up last is not necessarily one that can
		// usefully supply the difference.
		const wanted = Math.round( ( count * source.share ) / totalShare );

		if ( wanted <= 0 ) {
			continue;
		}

		onLog( `Collecting ${ wanted } from ${ source.label }…` );

		try {
			const entries = await source.collect( wanted, rng, shape );
			collected.push( ...entries );

			if ( entries.length < wanted ) {
				onLog(
					`  only ${ entries.length } of ${ wanted } available from ${ source.label }`
				);
			}
		} catch ( error ) {
			onLog( `  ! ${ source.label } failed: ${ error.message }` );
		}
	}

	// Sources are collected one after another, and the run stops once it has
	// enough usable images. Handing back the concatenation would let whichever
	// source came first fill the whole quota, so deal them out round-robin and
	// keep the mix intact however many get rejected downstream.
	return interleave( collected );
}

/**
 * Downloads an image.
 *
 * @param {string} url           Image URL.
 * @param {string} [fallbackUrl] URL to try when the first one is missing.
 * @return {Promise<Uint8Array>} Image bytes.
 */
export async function download( url, fallbackUrl ) {
	const response = await fetch( url, {
		headers: { 'user-agent': USER_AGENT },
	} );

	if ( ! response.ok ) {
		if ( fallbackUrl ) {
			return download( fallbackUrl );
		}

		throw new Error( `${ response.status } ${ response.statusText }` );
	}

	return new Uint8Array( await response.arrayBuffer() );
}
