/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

function getTitle( providerName ) {
	return sprintf(
		/* translators: %s: provider name */
		__( '%s Embed' ),
		providerName
	);
}

/**
 * The embed provider services.
 *
 * @type {WPBlockVariation[]}
 */
const variations = [
	{
		name: 'twitter',
		title: getTitle( 'Twitter' ),
		icon: embedTwitterIcon,
		keywords: [ 'tweet', __( 'social' ) ],
		description: __( 'Embed a tweet.' ),
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
		attributes: { providerNameSlug: 'twitter', responsive: true },
	},
	{
		name: 'youtube',
		title: getTitle( 'YouTube' ),
		icon: embedYouTubeIcon,
		keywords: [ __( 'music' ), __( 'video' ) ],
		description: __( 'Embed a YouTube video.' ),
		patterns: [
			/^https?:\/\/((m|www)\.)?youtube\.com\/.+/i,
			/^https?:\/\/youtu\.be\/.+/i,
		],
		attributes: { providerNameSlug: 'youtube', responsive: true },
	},
	{
		// Deprecate Facebook Embed per FB policy
		// See: https://developers.facebook.com/docs/plugins/oembed-legacy
		name: 'facebook',
		title: getTitle( 'Facebook' ),
		icon: embedFacebookIcon,
		keywords: [ __( 'social' ) ],
		description: __( 'Embed a Facebook post.' ),
		scope: [ 'block' ],
		patterns: [],
		attributes: {
			providerNameSlug: 'facebook',
			previewable: false,
			responsive: true,
		},
	},
	{
		// Deprecate Instagram per FB policy
		// See: https://developers.facebook.com/docs/instagram/oembed-legacy
		name: 'instagram',
		title: getTitle( 'Instagram' ),
		icon: embedInstagramIcon,
		keywords: [ __( 'image' ), __( 'social' ) ],
		description: __( 'Embed an Instagram post.' ),
		scope: [ 'block' ],
		patterns: [],
		attributes: { providerNameSlug: 'instagram', responsive: true },
	},
	{
		name: 'wordpress',
		title: getTitle( 'WordPress' ),
		icon: embedWordPressIcon,
		keywords: [ __( 'post' ), __( 'blog' ) ],
		description: __( 'Embed a WordPress post.' ),
		attributes: {
			providerNameSlug: 'wordpress',
		},
	},
	{
		name: 'soundcloud',
		title: getTitle( 'SoundCloud' ),
		icon: embedAudioIcon,
		keywords: [ __( 'music' ), __( 'audio' ) ],
		description: __( 'Embed SoundCloud content.' ),
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
		attributes: { providerNameSlug: 'soundcloud', responsive: true },
	},
	{
		name: 'spotify',
		title: getTitle( 'Spotify' ),
		icon: embedSpotifyIcon,
		keywords: [ __( 'music' ), __( 'audio' ) ],
		description: __( 'Embed Spotify content.' ),
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
		attributes: { providerNameSlug: 'spotify', responsive: true },
	},
	{
		name: 'flickr',
		title: getTitle( 'Flickr' ),
		icon: embedFlickrIcon,
		keywords: [ __( 'image' ) ],
		description: __( 'Embed Flickr content.' ),
		patterns: [
			/^https?:\/\/(www\.)?flickr\.com\/.+/i,
			/^https?:\/\/flic\.kr\/.+/i,
		],
		attributes: { providerNameSlug: 'flickr', responsive: true },
	},
	{
		name: 'vimeo',
		title: getTitle( 'Vimeo' ),
		icon: embedVimeoIcon,
		keywords: [ __( 'video' ) ],
		description: __( 'Embed a Vimeo video.' ),
		patterns: [ /^https?:\/\/(www\.)?vimeo\.com\/.+/i ],
		attributes: { providerNameSlug: 'vimeo', responsive: true },
	},
	{
		name: 'animoto',
		title: getTitle( 'Animoto' ),
		icon: embedAnimotoIcon,
		description: __( 'Embed an Animoto video.' ),
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
		attributes: { providerNameSlug: 'animoto', responsive: true },
	},
	{
		name: 'cloudup',
		title: getTitle( 'Cloudup' ),
		icon: embedContentIcon,
		description: __( 'Embed Cloudup content.' ),
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
		attributes: { providerNameSlug: 'cloudup', responsive: true },
	},
	{
		// Deprecated since CollegeHumor content is now powered by YouTube.
		name: 'collegehumor',
		title: getTitle( 'CollegeHumor' ),
		icon: embedVideoIcon,
		description: __( 'Embed CollegeHumor content.' ),
		scope: [ 'block' ],
		patterns: [],
		attributes: { providerNameSlug: 'collegehumor', responsive: true },
	},
	{
		name: 'crowdsignal',
		title: getTitle( 'Crowdsignal' ),
		icon: embedContentIcon,
		keywords: [ 'polldaddy', __( 'survey' ) ],
		description: __( 'Embed Crowdsignal (formerly Polldaddy) content.' ),
		patterns: [
			/^https?:\/\/((.+\.)?polldaddy\.com|poll\.fm|.+\.crowdsignal\.net|.+\.survey\.fm)\/.+/i,
		],
		attributes: { providerNameSlug: 'crowdsignal', responsive: true },
	},
	{
		name: 'dailymotion',
		title: getTitle( 'Dailymotion' ),
		icon: embedDailymotionIcon,
		keywords: [ __( 'video' ) ],
		description: __( 'Embed a Dailymotion video.' ),
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
		attributes: { providerNameSlug: 'dailymotion', responsive: true },
	},
	{
		name: 'imgur',
		title: getTitle( 'Imgur' ),
		icon: embedPhotoIcon,
		description: __( 'Embed Imgur content.' ),
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
		attributes: { providerNameSlug: 'imgur', responsive: true },
	},
	{
		name: 'issuu',
		title: getTitle( 'Issuu' ),
		icon: embedContentIcon,
		description: __( 'Embed Issuu content.' ),
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
		attributes: { providerNameSlug: 'issuu', responsive: true },
	},
	{
		name: 'kickstarter',
		title: getTitle( 'Kickstarter' ),
		icon: embedContentIcon,
		description: __( 'Embed Kickstarter content.' ),
		patterns: [
			/^https?:\/\/(www\.)?kickstarter\.com\/.+/i,
			/^https?:\/\/kck\.st\/.+/i,
		],
		attributes: { providerNameSlug: 'kickstarter', responsive: true },
	},
	{
		name: 'mixcloud',
		title: getTitle( 'Mixcloud' ),
		icon: embedAudioIcon,
		keywords: [ __( 'music' ), __( 'audio' ) ],
		description: __( 'Embed Mixcloud content.' ),
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
		attributes: { providerNameSlug: 'mixcloud', responsive: true },
	},
	{
		name: 'pocket-casts',
		title: getTitle( 'Pocket Casts' ),
		icon: embedPocketCastsIcon,
		keywords: [ __( 'podcast' ), __( 'audio' ) ],
		description: __( 'Embed a podcast player from Pocket Casts.' ),
		patterns: [ /^https:\/\/pca.st\/\w+/i ],
		attributes: { providerNameSlug: 'pocket-casts', responsive: true },
	},
	{
		name: 'reddit',
		title: getTitle( 'Reddit' ),
		icon: embedRedditIcon,
		description: __( 'Embed a Reddit thread.' ),
		patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
		attributes: { providerNameSlug: 'reddit', responsive: true },
	},
	{
		name: 'reverbnation',
		title: getTitle( 'ReverbNation' ),
		icon: embedAudioIcon,
		description: __( 'Embed ReverbNation content.' ),
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
		attributes: { providerNameSlug: 'reverbnation', responsive: true },
	},
	{
		name: 'screencast',
		title: getTitle( 'Screencast' ),
		icon: embedVideoIcon,
		description: __( 'Embed Screencast content.' ),
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
		attributes: { providerNameSlug: 'screencast', responsive: true },
	},
	{
		name: 'scribd',
		title: getTitle( 'Scribd' ),
		icon: embedContentIcon,
		description: __( 'Embed Scribd content.' ),
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
		attributes: { providerNameSlug: 'scribd', responsive: true },
	},
	{
		name: 'smugmug',
		title: getTitle( 'SmugMug' ),
		icon: embedPhotoIcon,
		description: __( 'Embed SmugMug content.' ),
		patterns: [ /^https?:\/\/(.+\.)?smugmug\.com\/.*/i ],
		attributes: {
			providerNameSlug: 'smugmug',
			previewable: false,
			responsive: true,
		},
	},
	{
		name: 'speaker-deck',
		title: getTitle( 'Speaker Deck' ),
		icon: embedContentIcon,
		description: __( 'Embed Speaker Deck content.' ),
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
		attributes: { providerNameSlug: 'speaker-deck', responsive: true },
	},
	{
		name: 'tiktok',
		title: getTitle( 'TikTok' ),
		icon: embedVideoIcon,
		keywords: [ __( 'video' ) ],
		description: __( 'Embed a TikTok video.' ),
		patterns: [ /^https?:\/\/(www\.)?tiktok\.com\/.+/i ],
		attributes: { providerNameSlug: 'tiktok', responsive: true },
	},
	{
		name: 'ted',
		title: getTitle( 'TED' ),
		icon: embedVideoIcon,
		description: __( 'Embed a TED video.' ),
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
		attributes: { providerNameSlug: 'ted', responsive: true },
	},
	{
		name: 'tumblr',
		title: getTitle( 'Tumblr' ),
		icon: embedTumblrIcon,
		keywords: [ __( 'social' ) ],
		description: __( 'Embed a Tumblr post.' ),
		patterns: [ /^https?:\/\/(.+)\.tumblr\.com\/.+/i ],
		attributes: { providerNameSlug: 'tumblr', responsive: true },
	},
	{
		name: 'videopress',
		title: getTitle( 'VideoPress' ),
		icon: embedVideoIcon,
		keywords: [ __( 'video' ) ],
		description: __( 'Embed a VideoPress video.' ),
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
		attributes: { providerNameSlug: 'videopress', responsive: true },
	},
	{
		name: 'wordpress-tv',
		title: getTitle( 'WordPress.tv' ),
		icon: embedVideoIcon,
		description: __( 'Embed a WordPress.tv video.' ),
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
		attributes: { providerNameSlug: 'wordpress-tv', responsive: true },
	},
	{
		name: 'amazon-kindle',
		title: getTitle( 'Amazon Kindle' ),
		icon: embedAmazonIcon,
		keywords: [ __( 'ebook' ) ],
		description: __( 'Embed Amazon Kindle content.' ),
		patterns: [
			/^https?:\/\/([a-z0-9-]+\.)?(amazon|amzn)(\.[a-z]{2,4})+\/.+/i,
			/^https?:\/\/(www\.)?(a\.co|z\.cn)\/.+/i,
		],
		attributes: { providerNameSlug: 'amazon-kindle' },
	},
	{
		name: 'pinterest',
		title: getTitle( 'Pinterest' ),
		icon: embedPinterestIcon,
		keywords: [ __( 'social' ), __( 'bookmark' ) ],
		description: __( 'Embed Pinterest pins, boards, and profiles.' ),
		patterns: [
			/^https?:\/\/([a-z]{2}|www)\.pinterest\.com(\.(au|mx))?\/.*/i,
		],
		attributes: { providerNameSlug: 'pinterest' },
	},
	{
		name: 'wolfram-cloud',
		title: getTitle( 'Wolfram' ),
		icon: embedWolframIcon,
		description: __( 'Embed Wolfram notebook content.' ),
		patterns: [ /^https?:\/\/(www\.)?wolframcloud\.com\/obj\/.+/i ],
		attributes: { providerNameSlug: 'wolfram-cloud', responsive: true },
	},
	{
		name: 'bluesky',
		title: getTitle( 'Bluesky' ),
		icon: embedBlueskyIcon,
		description: __( 'Embed a Bluesky post.' ),
		patterns: [ /^https?:\/\/bsky\.app\/profile\/.+\/post\/.+/i ],
		attributes: { providerNameSlug: 'bluesky' },
	},
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
