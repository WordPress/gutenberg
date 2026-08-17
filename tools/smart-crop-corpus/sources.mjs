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

/**
 * Categories in the Photo Directory, weighted towards the subjects where a
 * centre crop is most likely to be wrong.
 *
 * The directory itself is 63% `nature` and only 3.8% `people`. Sampling it
 * proportionally would mostly grade landscapes, which are the case where centre
 * cropping already does fine. These weights deliberately oversample subjects
 * that have a subject to miss.
 */
const PHOTO_CATEGORY_WEIGHTS = {
	people: 5,
	animals: 4,
	'food-drink': 3,
	objects: 3,
	fashion: 2,
	athletics: 2,
	'arts-culture': 2,
	transportation: 2,
	architecture: 1,
	interiors: 1,
	technology: 1,
	nature: 1,
	patterns: 1,
};

/**
 * Fetches JSON with a descriptive user agent and a useful error on failure.
 *
 * @param {string} url       URL to fetch.
 * @param {Object} [options] Fetch options.
 * @return {Promise<any>} Parsed JSON body.
 */
async function fetchJson( url, options = {} ) {
	const response = await fetch( url, {
		...options,
		headers: { 'user-agent': USER_AGENT, ...options.headers },
	} );

	if ( ! response.ok ) {
		throw new Error(
			`Request failed (${ response.status } ${ response.statusText }): ${ url }`
		);
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
 * Picks a weighted-random key from a `{ key: weight }` map.
 *
 * @param {Object}   weights Map of key to relative weight.
 * @param {Function} rng     Random number generator returning 0..1.
 * @return {string} The chosen key.
 */
function weightedPick( weights, rng ) {
	const entries = Object.entries( weights );
	const total = entries.reduce( ( sum, [ , weight ] ) => sum + weight, 0 );
	let target = rng() * total;

	for ( const [ key, weight ] of entries ) {
		target -= weight;
		if ( target <= 0 ) {
			return key;
		}
	}

	return entries[ entries.length - 1 ][ 0 ];
}

/**
 * WordPress Photo Directory: 43,000+ CC0 photographs submitted by the community.
 *
 * This is the closest public stand-in for "what people upload to WordPress",
 * and CC0 means there is no attribution burden on the harness.
 *
 * @param {number}   count Number of images to collect.
 * @param {Function} rng   Random number generator returning 0..1.
 * @return {Promise<Array>} Corpus entries.
 */
async function fromPhotoDirectory( count, rng ) {
	const base = 'https://wordpress.org/photos/wp-json/wp/v2';

	const { body: categories } = await fetchJson(
		`${ base }/photo-categories?per_page=100&_fields=id,slug,count`
	);
	const bySlug = Object.fromEntries(
		categories.map( ( term ) => [ term.slug, term ] )
	);

	const entries = [];
	const seen = new Set();
	let attempts = 0;

	// Each pass picks one weighted-random category and a random offset within
	// it, so consecutive runs land in completely different parts of the archive.
	while ( entries.length < count && attempts < count * 4 ) {
		attempts++;

		const slug = weightedPick( PHOTO_CATEGORY_WEIGHTS, rng );
		const term = bySlug[ slug ];
		if ( ! term || ! term.count ) {
			continue;
		}

		const perPage = 20;
		const offset = Math.floor(
			rng() * Math.max( 1, term.count - perPage )
		);
		const { body: photos } = await fetchJson(
			`${ base }/photos?per_page=${ perPage }&offset=${ offset }` +
				`&photo-categories=${ term.id }&_embed=wp:featuredmedia`
		);

		for ( const photo of sample( photos, 3, rng ) ) {
			if ( entries.length >= count ) {
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
				subject: slug,
				width: rendition?.width || details.width,
				height: rendition?.height || details.height,
			} );
		}
	}

	return entries;
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
	const perPage = 40;
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
		// Most of a run should be photographs, because that is most of what
		// gets uploaded and where a better crop actually helps.
		share: 0.6,
	},
	themes: {
		label: 'Theme screenshots',
		collect: fromThemeScreenshots,
		share: 0.2,
	},
	plugins: {
		label: 'Plugin banners',
		collect: fromPluginBanners,
		share: 0.2,
	},
};

/**
 * Builds a mixed corpus across the enabled sources.
 *
 * @param {Object}   options
 * @param {number}   options.count   Total number of images.
 * @param {string[]} options.sources Source keys to draw from.
 * @param {Function} options.rng     Random number generator returning 0..1.
 * @param {Function} options.onLog   Progress reporter.
 * @return {Promise<Array>} Corpus entries.
 */
export async function buildCorpus( { count, sources, rng, onLog } ) {
	const enabled = sources.filter( ( key ) => SOURCES[ key ] );
	const totalShare = enabled.reduce(
		( sum, key ) => sum + SOURCES[ key ].share,
		0
	);

	const collected = [];

	for ( const [ index, key ] of enabled.entries() ) {
		const source = SOURCES[ key ];
		// The last source absorbs the rounding remainder so the run hits `count`.
		const wanted =
			index === enabled.length - 1
				? count - collected.length
				: Math.round( ( count * source.share ) / totalShare );

		if ( wanted <= 0 ) {
			continue;
		}

		onLog( `Collecting ${ wanted } from ${ source.label }…` );

		try {
			collected.push( ...( await source.collect( wanted, rng ) ) );
		} catch ( error ) {
			onLog( `  ! ${ source.label } failed: ${ error.message }` );
		}
	}

	return collected;
}

/**
 * Downloads an image.
 *
 * @param {string} url Image URL.
 * @return {Promise<Uint8Array>} Image bytes.
 */
export async function download( url ) {
	const response = await fetch( url, {
		headers: { 'user-agent': USER_AGENT },
	} );

	if ( ! response.ok ) {
		throw new Error( `${ response.status } ${ response.statusText }` );
	}

	return new Uint8Array( await response.arrayBuffer() );
}
