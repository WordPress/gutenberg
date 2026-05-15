/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	AmazonIcon,
	BandcampIcon,
	BehanceIcon,
	BlueskyIcon,
	ChainIcon,
	CodepenIcon,
	DeviantArtIcon,
	DiscordIcon,
	DribbbleIcon,
	DropboxIcon,
	EtsyIcon,
	FacebookIcon,
	FeedIcon,
	FivehundredpxIcon,
	FlickrIcon,
	FoursquareIcon,
	GoodreadsIcon,
	GoogleIcon,
	GitHubIcon,
	GravatarIcon,
	InstagramIcon,
	LastfmIcon,
	LinkedInIcon,
	MailIcon,
	MastodonIcon,
	MeetupIcon,
	MediumIcon,
	PatreonIcon,
	PinterestIcon,
	PocketIcon,
	RedditIcon,
	SkypeIcon,
	SnapchatIcon,
	SoundCloudIcon,
	SpotifyIcon,
	TelegramIcon,
	ThreadsIcon,
	TiktokIcon,
	TumblrIcon,
	TwitchIcon,
	TwitterIcon,
	VimeoIcon,
	VkIcon,
	WhatsAppIcon,
	WordPressIcon,
	XIcon,
	YelpIcon,
	YouTubeIcon,
} from './icons';

const variations = [
	{
		isDefault: true,
		name: 'wordpress',
		attributes: { service: 'wordpress' },
		title: _x( 'WordPress', 'social link block variation name' ),
		icon: WordPressIcon,
	},

	{
		name: 'fivehundredpx',
		attributes: { service: 'fivehundredpx' },
		title: _x( '500px', 'social link block variation name' ),
		icon: FivehundredpxIcon,
	},
	{
		name: 'amazon',
		attributes: { service: 'amazon' },
		title: _x( 'Amazon', 'social link block variation name' ),
		icon: AmazonIcon,
	},
	{
		name: 'bandcamp',
		attributes: { service: 'bandcamp' },
		title: _x( 'Bandcamp', 'social link block variation name' ),
		icon: BandcampIcon,
	},
	{
		name: 'behance',
		attributes: { service: 'behance' },
		title: _x( 'Behance', 'social link block variation name' ),
		icon: BehanceIcon,
	},
	{
		name: 'bluesky',
		attributes: { service: 'bluesky' },
		title: _x( 'Bluesky', 'social link block variation name' ),
		icon: BlueskyIcon,
	},
	{
		name: 'chain',
		attributes: { service: 'chain' },
		title: _x( 'Link', 'social link block variation name' ),
		icon: ChainIcon,
	},
	{
		name: 'codepen',
		attributes: { service: 'codepen' },
		title: _x( 'CodePen', 'social link block variation name' ),
		icon: CodepenIcon,
	},
	{
		name: 'deviantart',
		attributes: { service: 'deviantart' },
		title: _x( 'DeviantArt', 'social link block variation name' ),
		icon: DeviantArtIcon,
	},
	{
		name: 'discord',
		attributes: { service: 'discord' },
		title: _x( 'Discord', 'social link block variation name' ),
		icon: DiscordIcon,
	},
	{
		name: 'dribbble',
		attributes: { service: 'dribbble' },
		title: _x( 'Dribbble', 'social link block variation name' ),
		icon: DribbbleIcon,
	},
	{
		name: 'dropbox',
		attributes: { service: 'dropbox' },
		title: _x( 'Dropbox', 'social link block variation name' ),
		icon: DropboxIcon,
	},
	{
		name: 'etsy',
		attributes: { service: 'etsy' },
		title: _x( 'Etsy', 'social link block variation name' ),
		icon: EtsyIcon,
	},
	{
		name: 'facebook',
		attributes: { service: 'facebook' },
		title: _x( 'Facebook', 'social link block variation name' ),
		icon: FacebookIcon,
	},
	{
		name: 'feed',
		attributes: { service: 'feed' },
		title: _x( 'RSS Feed', 'social link block variation name' ),
		icon: FeedIcon,
	},
	{
		name: 'flickr',
		attributes: { service: 'flickr' },
		title: _x( 'Flickr', 'social link block variation name' ),
		icon: FlickrIcon,
	},
	{
		name: 'foursquare',
		attributes: { service: 'foursquare' },
		title: _x( 'Foursquare', 'social link block variation name' ),
		icon: FoursquareIcon,
	},
	{
		name: 'goodreads',
		attributes: { service: 'goodreads' },
		title: _x( 'Goodreads', 'social link block variation name' ),
		icon: GoodreadsIcon,
	},
	{
		name: 'google',
		attributes: { service: 'google' },
		title: _x( 'Google', 'social link block variation name' ),
		icon: GoogleIcon,
	},
	{
		name: 'github',
		attributes: { service: 'github' },
		title: _x( 'GitHub', 'social link block variation name' ),
		icon: GitHubIcon,
	},
	{
		name: 'gravatar',
		attributes: { service: 'gravatar' },
		title: _x( 'Gravatar', 'social link block variation name' ),
		icon: GravatarIcon,
	},
	{
		name: 'instagram',
		attributes: { service: 'instagram' },
		title: _x( 'Instagram', 'social link block variation name' ),
		icon: InstagramIcon,
	},
	{
		name: 'lastfm',
		attributes: { service: 'lastfm' },
		title: _x( 'Last.fm', 'social link block variation name' ),
		icon: LastfmIcon,
	},
	{
		name: 'linkedin',
		attributes: { service: 'linkedin' },
		title: _x( 'LinkedIn', 'social link block variation name' ),
		icon: LinkedInIcon,
	},
	{
		name: 'mail',
		attributes: { service: 'mail' },
		title: _x( 'Mail', 'social link block variation name' ),
		keywords: [ 'email', 'e-mail' ],
		icon: MailIcon,
	},
	{
		name: 'mastodon',
		attributes: { service: 'mastodon' },
		title: _x( 'Mastodon', 'social link block variation name' ),
		icon: MastodonIcon,
	},
	{
		name: 'meetup',
		attributes: { service: 'meetup' },
		title: _x( 'Meetup', 'social link block variation name' ),
		icon: MeetupIcon,
	},
	{
		name: 'medium',
		attributes: { service: 'medium' },
		title: _x( 'Medium', 'social link block variation name' ),
		icon: MediumIcon,
	},
	{
		name: 'patreon',
		attributes: { service: 'patreon' },
		title: _x( 'Patreon', 'social link block variation name' ),
		icon: PatreonIcon,
	},
	{
		name: 'pinterest',
		attributes: { service: 'pinterest' },
		title: _x( 'Pinterest', 'social link block variation name' ),
		icon: PinterestIcon,
	},
	{
		name: 'pocket',
		attributes: { service: 'pocket' },
		title: _x( 'Pocket', 'social link block variation name' ),
		icon: PocketIcon,
	},
	{
		name: 'reddit',
		attributes: { service: 'reddit' },
		title: _x( 'Reddit', 'social link block variation name' ),
		icon: RedditIcon,
	},
	{
		name: 'skype',
		attributes: { service: 'skype' },
		title: _x( 'Skype', 'social link block variation name' ),
		icon: SkypeIcon,
		// Deprecated: Skype service is no longer available.
		scope: [],
	},
	{
		name: 'snapchat',
		attributes: { service: 'snapchat' },
		title: _x( 'Snapchat', 'social link block variation name' ),
		icon: SnapchatIcon,
	},
	{
		name: 'soundcloud',
		attributes: { service: 'soundcloud' },
		title: _x( 'SoundCloud', 'social link block variation name' ),
		icon: SoundCloudIcon,
	},
	{
		name: 'spotify',
		attributes: { service: 'spotify' },
		title: _x( 'Spotify', 'social link block variation name' ),
		icon: SpotifyIcon,
	},
	{
		name: 'telegram',
		attributes: { service: 'telegram' },
		title: _x( 'Telegram', 'social link block variation name' ),
		icon: TelegramIcon,
	},
	{
		name: 'threads',
		attributes: { service: 'threads' },
		title: _x( 'Threads', 'social link block variation name' ),
		icon: ThreadsIcon,
	},
	{
		name: 'tiktok',
		attributes: { service: 'tiktok' },
		title: _x( 'TikTok', 'social link block variation name' ),
		icon: TiktokIcon,
	},
	{
		name: 'tumblr',
		attributes: { service: 'tumblr' },
		title: _x( 'Tumblr', 'social link block variation name' ),
		icon: TumblrIcon,
	},
	{
		name: 'twitch',
		attributes: { service: 'twitch' },
		title: _x( 'Twitch', 'social link block variation name' ),
		icon: TwitchIcon,
	},
	{
		name: 'twitter',
		attributes: { service: 'twitter' },
		title: _x( 'Twitter', 'social link block variation name' ),
		icon: TwitterIcon,
	},
	{
		name: 'vimeo',
		attributes: { service: 'vimeo' },
		title: _x( 'Vimeo', 'social link block variation name' ),
		icon: VimeoIcon,
	},
	{
		name: 'vk',
		attributes: { service: 'vk' },
		title: _x( 'VK', 'social link block variation name' ),
		icon: VkIcon,
	},
	{
		name: 'whatsapp',
		attributes: { service: 'whatsapp' },
		title: _x( 'WhatsApp', 'social link block variation name' ),
		icon: WhatsAppIcon,
	},
	{
		name: 'x',
		attributes: { service: 'x' },
		keywords: [ 'twitter' ],
		title: _x( 'X', 'social link block variation name' ),
		icon: XIcon,
	},
	{
		name: 'yelp',
		attributes: { service: 'yelp' },
		title: _x( 'Yelp', 'social link block variation name' ),
		icon: YelpIcon,
	},
	{
		name: 'youtube',
		attributes: { service: 'youtube' },
		title: _x( 'YouTube', 'social link block variation name' ),
		icon: YouTubeIcon,
	},
];

/**
 * Add `isActive` function to all `social link` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
	if ( variation.isActive ) {
		return;
	}
	variation.isActive = ( blockAttributes, variationAttributes ) =>
		blockAttributes.service === variationAttributes.service;
} );

export default variations;
