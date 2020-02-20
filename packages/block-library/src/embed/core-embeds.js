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
			description: __( 'Embed a YouTube video.' ),
		},
		patterns: [
			/^https?:\/\/((m|www)\.)?youtube\.com\/.+/i,
			/^https?:\/\/youtu\.be\/.+/i,
		],
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
			description: __( 'Embed SoundCloud content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?soundcloud\.com\/.+/i ],
	},
	{
		name: 'core-embed/spotify',
		settings: {
			title: 'Spotify',
			icon: embedSpotifyIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
			description: __( 'Embed Spotify content.' ),
		},
		patterns: [ /^https?:\/\/(open|play)\.spotify\.com\/.+/i ],
	},
	{
		name: 'core-embed/flickr',
		settings: {
			title: 'Flickr',
			icon: embedFlickrIcon,
			keywords: [ __( 'image' ) ],
			description: __( 'Embed Flickr content.' ),
		},
		patterns: [
			/^https?:\/\/(www\.)?flickr\.com\/.+/i,
			/^https?:\/\/flic\.kr\/.+/i,
		],
	},
	{
		name: 'core-embed/vimeo',
		settings: {
			title: 'Vimeo',
			icon: embedVimeoIcon,
			keywords: [ __( 'video' ) ],
			description: __( 'Embed a Vimeo video.' ),
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
			description: __( 'Embed an Animoto video.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?(animoto|video214)\.com\/.+/i ],
	},
	{
		name: 'core-embed/cloudup',
		settings: {
			title: 'Cloudup',
			icon: embedContentIcon,
			description: __( 'Embed Cloudup content.' ),
		},
		patterns: [ /^https?:\/\/cloudup\.com\/.+/i ],
	},
	{
		// Deprecated since CollegeHumor content is now powered by YouTube
		name: 'core-embed/collegehumor',
		settings: {
			title: 'CollegeHumor',
			icon: embedVideoIcon,
			description: __( 'Embed CollegeHumor content.' ),
			supports: {
				inserter: false,
			},
		},
		patterns: [],
	},
	{
		name: 'core-embed/crowdsignal',
		settings: {
			title: 'Crowdsignal',
			icon: embedContentIcon,
			keywords: [ 'polldaddy' ],
			transform: [
				{
					type: 'block',
					blocks: [ 'core-embed/polldaddy' ],
					transform: ( content ) => {
						return createBlock( 'core-embed/crowdsignal', {
							content,
						} );
					},
				},
			],
			description: __(
				'Embed Crowdsignal (formerly Polldaddy) content.'
			),
		},
		patterns: [
			/^https?:\/\/((.+\.)?polldaddy\.com|poll\.fm|.+\.survey\.fm)\/.+/i,
		],
	},
	{
		name: 'core-embed/dailymotion',
		settings: {
			title: 'Dailymotion',
			icon: embedVideoIcon,
			description: __( 'Embed a Dailymotion video.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?dailymotion\.com\/.+/i ],
	},
	{
		name: 'core-embed/hulu',
		settings: {
			title: 'Hulu',
			icon: embedVideoIcon,
			description: __( 'Embed Hulu content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?hulu\.com\/.+/i ],
	},
	{
		name: 'core-embed/imgur',
		settings: {
			title: 'Imgur',
			icon: embedPhotoIcon,
			description: __( 'Embed Imgur content.' ),
		},
		patterns: [ /^https?:\/\/(.+\.)?imgur\.com\/.+/i ],
	},
	{
		name: 'core-embed/issuu',
		settings: {
			title: 'Issuu',
			icon: embedContentIcon,
			description: __( 'Embed Issuu content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?issuu\.com\/.+/i ],
	},
	{
		name: 'core-embed/kickstarter',
		settings: {
			title: 'Kickstarter',
			icon: embedContentIcon,
			description: __( 'Embed Kickstarter content.' ),
		},
		patterns: [
			/^https?:\/\/(www\.)?kickstarter\.com\/.+/i,
			/^https?:\/\/kck\.st\/.+/i,
		],
	},
	{
		name: 'core-embed/meetup-com',
		settings: {
			title: 'Meetup.com',
			icon: embedContentIcon,
			description: __( 'Embed Meetup.com content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?meetu(\.ps|p\.com)\/.+/i ],
	},
	{
		name: 'core-embed/mixcloud',
		settings: {
			title: 'Mixcloud',
			icon: embedAudioIcon,
			keywords: [ __( 'music' ), __( 'audio' ) ],
			description: __( 'Embed Mixcloud content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?mixcloud\.com\/.+/i ],
	},
	{
		// Deprecated in favour of the core-embed/crowdsignal block
		name: 'core-embed/polldaddy',
		settings: {
			title: 'Polldaddy',
			icon: embedContentIcon,
			description: __( 'Embed Polldaddy content.' ),
			supports: {
				inserter: false,
			},
		},
		patterns: [],
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
			description: __( 'Embed ReverbNation content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?reverbnation\.com\/.+/i ],
	},
	{
		name: 'core-embed/screencast',
		settings: {
			title: 'Screencast',
			icon: embedVideoIcon,
			description: __( 'Embed Screencast content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?screencast\.com\/.+/i ],
	},
	{
		name: 'core-embed/scribd',
		settings: {
			title: 'Scribd',
			icon: embedContentIcon,
			description: __( 'Embed Scribd content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?scribd\.com\/.+/i ],
	},
	{
		name: 'core-embed/slideshare',
		settings: {
			title: 'Slideshare',
			icon: embedContentIcon,
			description: __( 'Embed Slideshare content.' ),
		},
		patterns: [ /^https?:\/\/(.+?\.)?slideshare\.net\/.+/i ],
	},
	{
		name: 'core-embed/smugmug',
		settings: {
			title: 'SmugMug',
			icon: embedPhotoIcon,
			description: __( 'Embed SmugMug content.' ),
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
			transform: [
				{
					type: 'block',
					blocks: [ 'core-embed/speaker' ],
					transform: ( content ) => {
						return createBlock( 'core-embed/speaker-deck', {
							content,
						} );
					},
				},
			],
			description: __( 'Embed Speaker Deck content.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?speakerdeck\.com\/.+/i ],
	},
	{
		name: 'core-embed/tiktok',
		settings: {
			title: 'TikTok',
			icon: embedVideoIcon,
			description: __( 'Embed a TikTok video.' ),
		},
		patterns: [ /^https?:\/\/(www\.)?tiktok\.com\/.+/i ],
	},
	{
		name: 'core-embed/ted',
		settings: {
			title: 'TED',
			icon: embedVideoIcon,
			description: __( 'Embed a TED video.' ),
		},
		patterns: [ /^https?:\/\/(www\.|embed\.)?ted\.com\/.+/i ],
	},
	{
		name: 'core-embed/tumblr',
		settings: {
			title: 'Tumblr',
			icon: embedTumblrIcon,
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
			description: __( 'Embed a VideoPress video.' ),
		},
		patterns: [ /^https?:\/\/videopress\.com\/.+/i ],
	},
	{
		name: 'core-embed/wordpress-tv',
		settings: {
			title: 'WordPress.tv',
			icon: embedVideoIcon,
			description: __( 'Embed a WordPress.tv video.' ),
		},
		patterns: [ /^https?:\/\/wordpress\.tv\/.+/i ],
	},
	{
		name: 'core-embed/amazon-kindle',
		settings: {
			title: 'Amazon Kindle',
			icon: embedAmazonIcon,
			keywords: [ __( 'ebook' ) ],
			responsive: false,
			description: __( 'Embed Amazon Kindle content.' ),
		},
		patterns: [
			/^https?:\/\/([a-z0-9-]+\.)?(amazon|amzn)(\.[a-z]{2,4})+\/.+/i,
			/^https?:\/\/(www\.)?(a\.co|z\.cn)\/.+/i,
		],
	},
];
