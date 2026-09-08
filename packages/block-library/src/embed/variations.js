import {
	embedContentIcon,
	embedAudioIcon,
	embedPhotoIcon,
	embedVideoIcon,
	embedTwitterIcon,
	embedYouTubeIcon,
	embedFacebookIcon,
	embedInstagramIcon,
	embedWordPressIcon,
	embedSpotifyIcon,
	embedFlickrIcon,
	embedVimeoIcon,
	embedRedditIcon,
	embedTumblrIcon,
	embedAmazonIcon,
	embedAnimotoIcon,
	embedDailymotionIcon,
	embedPinterestIcon,
	embedWolframIcon,
	embedPocketCastsIcon,
	embedBlueskyIcon,
} from './icons';

/** @typedef {import('@wordpress/blocks').WPBlockVariation} WPBlockVariation */

/**
 * The parts of the embed provider variations only JavaScript can hold.
 *
 * Everything that can be written as data — the titles, descriptions,
 * keywords, URL patterns, attributes and oEmbed types — lives in
 * `block.json`, where the server-side conversion reads the same list the
 * editor matches a URL against. Each entry here is merged over the declared
 * variation of the same name when the block registers.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{ name: 'twitter', icon: embedTwitterIcon },
	{ name: 'youtube', icon: embedYouTubeIcon },
	{ name: 'facebook', icon: embedFacebookIcon },
	{ name: 'instagram', icon: embedInstagramIcon },
	{ name: 'wordpress', icon: embedWordPressIcon },
	{ name: 'soundcloud', icon: embedAudioIcon },
	{ name: 'spotify', icon: embedSpotifyIcon },
	{ name: 'flickr', icon: embedFlickrIcon },
	{ name: 'vimeo', icon: embedVimeoIcon },
	{ name: 'animoto', icon: embedAnimotoIcon },
	{ name: 'cloudup', icon: embedContentIcon },
	{ name: 'collegehumor', icon: embedVideoIcon },
	{ name: 'crowdsignal', icon: embedContentIcon },
	{ name: 'dailymotion', icon: embedDailymotionIcon },
	{ name: 'imgur', icon: embedPhotoIcon },
	{ name: 'issuu', icon: embedContentIcon },
	{ name: 'kickstarter', icon: embedContentIcon },
	{ name: 'mixcloud', icon: embedAudioIcon },
	{ name: 'pocket-casts', icon: embedPocketCastsIcon },
	{ name: 'reddit', icon: embedRedditIcon },
	{ name: 'reverbnation', icon: embedAudioIcon },
	{ name: 'scribd', icon: embedContentIcon },
	{ name: 'smugmug', icon: embedPhotoIcon },
	{ name: 'speaker-deck', icon: embedContentIcon },
	{ name: 'tiktok', icon: embedVideoIcon },
	{ name: 'ted', icon: embedVideoIcon },
	{ name: 'tumblr', icon: embedTumblrIcon },
	{ name: 'videopress', icon: embedVideoIcon },
	{ name: 'wordpress-tv', icon: embedVideoIcon },
	{ name: 'amazon-kindle', icon: embedAmazonIcon },
	{ name: 'pinterest', icon: embedPinterestIcon },
	{ name: 'wolfram-cloud', icon: embedWolframIcon },
	{ name: 'bluesky', icon: embedBlueskyIcon },
];

/**
 * Add `isActive` function to all `embed` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) {
		return;
	}
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.providerNameSlug ===
		variationAttributes.providerNameSlug;
} );

export default variations;
