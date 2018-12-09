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
	embedTumbrIcon,
} from './icons';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

export const common = [
	{
		name: 'core-embed/twitter',
		settings: {
			title: 'Twitter',
			icon: embedTwitterIcon,
			keywords: [ 'tweet' ],
			description: __( 'Embed a tweet.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
	},
	{
		name: 'core-embed/youtube',
		settings: {
			title: 'YouTube',
			icon: embedYouTubeIcon,
			keywords: [ __( 'music' ), __( 'video' ) ],
			description: sprintf( __( 'Embed a video from %s.' ), __( 'YouTube' ) ),
		},
		patterns: [ /^https?:\/\/((m|www)\.)?youtube\.com\/.+/i, /^https?:\/\/youtu\.be\/.+/i ],
	},
	{
		name: 'core-embed/facebook',
		settings: {
			title: 'Facebook',
			icon: embedFacebookIcon,
			description: __( 'Embed a Facebook post.' ),
		},
		patterns: [ /^https?:\/\/www\.facebook.com\/.+/i ],
	},
	{
		name: 'core-embed/instagram',
		settings: {
			title: 'Instagram',
			icon: embedInstagramIcon,
			keywords: [ __( 'image' ) ],
			description: __( 'Embed an Instagram post.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ],
	},
	{
		name: 'core-embed/wordpress',
		settings: {
			title: 'WordPress',
			icon: embedWordPressIcon,
			keywords: [ __( 'post' ), __( 'blog' ) ],
			responsive: false,
			description: __( 'Embed a WordPress post.' ),
		},
	},
	{
		name: 'core-embed/soundcloud',
		settings: {
			title: 'SoundCloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
			description: sprintf( __( 'Embed content from %s.' ), __( 'SoundCloud' ) ),
		},
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/spotify',
		settings: {
			title: 'Spotify',
			icon: embedSpotifyIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
			description: sprintf( __( 'Embed content from %s.' ), __( 'Spotify' ) ),
		},
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
	},
	{
		name: 'core-embed/flickr',
		settings: {
			title: 'Flickr',
			icon: embedFlickrIcon,
			keywords: [ __( 'image' ) ],
			description: sprintf( __( 'Embed content from %s.' ), __( 'Flickr' ) ),
		},
		patterns: [ /^https?:\/\/(www\.)?flickr\.com\/.+/i, /^https?:\/\/flic\.kr\/.+/i ],
	},
	{
		name: 'core-embed/vimeo',
		settings: {
			title: 'Vimeo',
			icon: embedVimeoIcon,
			keywords: [ __( 'video' ) ],
			description: sprintf( __( 'Embed a video from %s.' ), __( 'Vimeo' ) ),
		},
		patterns: [ /^https?:\/\/(www\.)?vimeo\.com\/.+/i ],
	},
];

export const others = [
	{
		name: 'core-embed/animoto',
		settings: {
			title: 'Animoto',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed a video from %s.' ), 'Animoto' ),
		},
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
	},
	{
		name: 'core-embed/cloudup',
		settings: {
			title: 'Cloudup',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Cloudup' ),
		},
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
	},
	{
		name: 'core-embed/collegehumor',
		settings: {
			title: 'CollegeHumor',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'CollegeHumor' ),
		},
		patterns: [ /^https?:\/\/(www\.)?collegehumor\.com\/.+/i ],
	},
	{
		name: 'core-embed/dailymotion',
		settings: {
			title: 'Dailymotion',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed a video from %s.' ), 'Dailymotion' ),
		},
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
	},
	{
		name: 'core-embed/funnyordie',
		settings: {
			title: 'Funny or Die',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Funny or Die' ),
		},
		patterns: [ /^https?:\/\/(www\.)?funnyordie\.com\/.+/i ],
	},
	{
		name: 'core-embed/hulu',
		settings: {
			title: 'Hulu',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Hulu' ),
		},
		patterns: [ /^https?:\/\/(www\.)?hulu\.com\/.+/i ],
	},
	{
		name: 'core-embed/imgur',
		settings: {
			title: 'Imgur',
			icon: embedPhotoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Imgur' ),
		},
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
	},
	{
		name: 'core-embed/issuu',
		settings: {
			title: 'Issuu',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Issuu' ),
		},
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
	},
	{
		name: 'core-embed/kickstarter',
		settings: {
			title: 'Kickstarter',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Kickstarter' ),
		},
		patterns: [ /^https?:\/\/(www\.)?kickstarter\.com\/.+/i, /^https?:\/\/kck\.st\/.+/i ],
	},
	{
		name: 'core-embed/meetup-com',
		settings: {
			title: 'Meetup.com',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Meetup.com' ),
		},
		patterns: [ /^https?:\/\/(www\.)?meetu(\.ps|p\.com)\/.+/i ],
	},
	{
		name: 'core-embed/mixcloud',
		settings: {
			title: 'Mixcloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
			description: sprintf( __( 'Embed content from %s.' ), 'Mixcloud' ),
		},
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/photobucket',
		settings: {
			title: 'Photobucket',
			icon: embedPhotoIcon,
			description: __( 'Embed a Photobucket image.' ),
		},
		patterns: [ /^http:\/\/g?i*\.photobucket\.com\/.+/i ],
	},
	{
		name: 'core-embed/polldaddy',
		settings: {
			title: 'Polldaddy',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Polldaddy' ),
		},
		patterns: [ /^https?:\/\/(www\.)?polldaddy\.com\/.+/i ],
	},
	{
		name: 'core-embed/reddit',
		settings: {
			title: 'Reddit',
			icon: embedRedditIcon,
			description: __( 'Embed a Reddit thread.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
	},
	{
		name: 'core-embed/reverbnation',
		settings: {
			title: 'ReverbNation',
			icon: embedAudioIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'ReverbNation' ),
		},
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
	},
	{
		name: 'core-embed/screencast',
		settings: {
			title: 'Screencast',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Screencast' ),
		},
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
	},
	{
		name: 'core-embed/scribd',
		settings: {
			title: 'Scribd',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Scribd' ),
		},
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
	},
	{
		name: 'core-embed/slideshare',
		settings: {
			title: 'Slideshare',
			icon: embedContentIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'Slideshare' ),
		},
		patterns: [ /^https?:\/\/(.+?\.)?slideshare\.net\/.+/i ],
	},
	{
		name: 'core-embed/smugmug',
		settings: {
			title: 'SmugMug',
			icon: embedPhotoIcon,
			description: sprintf( __( 'Embed content from %s.' ), 'SmugMug' ),
		},
		patterns: [ /^https?:\/\/(www\.)?smugmug\.com\/.+/i ],
	},
	{
		// Deprecated in favour of the core-embed/speaker-deck block.
		name: 'core-embed/speaker',
		settings: {
			title: 'Speaker',
			icon: embedAudioIcon,
			supports: {
				inserter: false,
			},
		},
		patterns: [],
	},
	{
		name: 'core-embed/speaker-deck',
		settings: {
			title: 'Speaker Deck',
			icon: embedContentIcon,
			transform: [ {
				type: 'block',
				blocks: [ 'core-embed/speaker' ],
				transform: ( content ) => {
					return createBlock( 'core-embed/speaker-deck', {
						content,
					} );
				},
			} ],
			description: sprintf( __( 'Embed content from %s.' ), 'Speaker Deck' ),
		},
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
	},
	{
		name: 'core-embed/ted',
		settings: {
			title: 'TED',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed a video from %s.' ), 'TED' ),
		},
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
	},
	{
		name: 'core-embed/tumblr',
		settings: {
			title: 'Tumblr',
			icon: embedTumbrIcon,
			description: __( 'Embed a Tumblr post.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?tumblr\.com\/.+/i ],
	},
	{
		name: 'core-embed/videopress',
		settings: {
			title: 'VideoPress',
			icon: embedVideoIcon,
			keywords: [ __( 'video' ) ],
			description: sprintf( __( 'Embed a video from %s.' ), 'VideoPress' ),
		},
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
	},
	{
		name: 'core-embed/wordpress-tv',
		settings: {
			title: 'WordPress.tv',
			icon: embedVideoIcon,
			description: sprintf( __( 'Embed a video from %s.' ), 'WordPress.tv' ),
		},
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
	},
];
