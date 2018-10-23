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
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

export const common = [
	{
		name: 'core-embed/twitter',
		settings: {
			title: 'Twitter',
			icon: embedTwitterIcon,
			keywords: [ 'tweet' ],
		},
		patterns: [ /^https?:\/\/(www\.)?twitter\.com\/.+/i ],
	},
	{
		name: 'core-embed/youtube',
		settings: {
			title: 'YouTube',
			icon: embedYouTubeIcon,
			keywords: [ __( 'music' ), __( 'video' ) ],
		},
		patterns: [ /^https?:\/\/((m|www)\.)?youtube\.com\/.+/i, /^https?:\/\/youtu\.be\/.+/i ],
	},
	{
		name: 'core-embed/facebook',
		settings: {
			title: 'Facebook',
			icon: embedFacebookIcon,
		},
		patterns: [ /^https?:\/\/www\.facebook.com\/.+/i ],
	},
	{
		name: 'core-embed/instagram',
		settings: {
			title: 'Instagram',
			icon: embedInstagramIcon,
			keywords: [ __( 'image' ) ],
		},
		patterns: [ /^https?:\/\/(www\.)?instagr(\.am|am\.com)\/.+/i ],
	},
	{
		name: 'core-embed/wordpress',
		settings: {
			title: 'WordPress',
			icon: embedWordPressIcon,
			keywords: [ __( 'post' ), __( 'blog' ) ],
		},
	},
	{
		name: 'core-embed/soundcloud',
		settings: {
			title: 'SoundCloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		},
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/spotify',
		settings: {
			title: 'Spotify',
			icon: embedSpotifyIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		},
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
	},
	{
		name: 'core-embed/flickr',
		settings: {
			title: 'Flickr',
			icon: embedFlickrIcon,
			keywords: [ __( 'image' ) ],
		},
		patterns: [ /^https?:\/\/(www\.)?flickr\.com\/.+/i, /^https?:\/\/flic\.kr\/.+/i ],
	},
	{
		name: 'core-embed/vimeo',
		settings: {
			title: 'Vimeo',
			icon: embedVimeoIcon,
			keywords: [ __( 'video' ) ],
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
		},
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
	},
	{
		name: 'core-embed/cloudup',
		settings: {
			title: 'Cloudup',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
	},
	{
		name: 'core-embed/collegehumor',
		settings: {
			title: 'CollegeHumor',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?collegehumor\.com\/.+/i ],
	},
	{
		name: 'core-embed/dailymotion',
		settings: {
			title: 'Dailymotion',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
	},
	{
		name: 'core-embed/funnyordie',
		settings: {
			title: 'Funny or Die',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?funnyordie\.com\/.+/i ],
	},
	{
		name: 'core-embed/hulu',
		settings: {
			title: 'Hulu',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?hulu\.com\/.+/i ],
	},
	{
		name: 'core-embed/imgur',
		settings: {
			title: 'Imgur',
			icon: embedPhotoIcon,
		},
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
	},
	{
		name: 'core-embed/issuu',
		settings: {
			title: 'Issuu',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
	},
	{
		name: 'core-embed/kickstarter',
		settings: {
			title: 'Kickstarter',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?kickstarter\.com\/.+/i, /^https?:\/\/kck\.st\/.+/i ],
	},
	{
		name: 'core-embed/meetup-com',
		settings: {
			title: 'Meetup.com',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?meetu(\.ps|p\.com)\/.+/i ],
	},
	{
		name: 'core-embed/mixcloud',
		settings: {
			title: 'Mixcloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
		},
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/photobucket',
		settings: {
			title: 'Photobucket',
			icon: embedPhotoIcon,
		},
		patterns: [ /^http:\/\/g?i*\.photobucket\.com\/.+/i ],
	},
	{
		name: 'core-embed/polldaddy',
		settings: {
			title: 'Polldaddy',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?polldaddy\.com\/.+/i ],
	},
	{
		name: 'core-embed/reddit',
		settings: {
			title: 'Reddit',
			icon: embedRedditIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
	},
	{
		name: 'core-embed/reverbnation',
		settings: {
			title: 'ReverbNation',
			icon: embedAudioIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
	},
	{
		name: 'core-embed/screencast',
		settings: {
			title: 'Screencast',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
	},
	{
		name: 'core-embed/scribd',
		settings: {
			title: 'Scribd',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
	},
	{
		name: 'core-embed/slideshare',
		settings: {
			title: 'Slideshare',
			icon: embedContentIcon,
		},
		patterns: [ /^https?:\/\/(.+?\.)?slideshare\.net\/.+/i ],
	},
	{
		name: 'core-embed/smugmug',
		settings: {
			title: 'SmugMug',
			icon: embedPhotoIcon,
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
		},
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
	},
	{
		name: 'core-embed/ted',
		settings: {
			title: 'TED',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
	},
	{
		name: 'core-embed/tumblr',
		settings: {
			title: 'Tumblr',
			icon: embedTumbrIcon,
		},
		patterns: [ /^https?:\/\/(www\.)?tumblr\.com\/.+/i ],
	},
	{
		name: 'core-embed/videopress',
		settings: {
			title: 'VideoPress',
			icon: embedVideoIcon,
			keywords: [ __( 'video' ) ],
		},
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
	},
	{
		name: 'core-embed/wordpress-tv',
		settings: {
			title: 'WordPress.tv',
			icon: embedVideoIcon,
		},
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
	},
];
