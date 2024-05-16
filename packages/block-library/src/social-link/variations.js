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
		title: 'WordPress',
		icon: WordPressIcon,
	},

	{
		name: 'fivehundredpx',
		attributes: { service: 'fivehundredpx' },
		title: '500px',
		icon: FivehundredpxIcon,
	},
	{
		name: 'amazon',
		attributes: { service: 'amazon' },
		title: 'Amazon',
		icon: AmazonIcon,
	},
	{
		name: 'bandcamp',
		attributes: { service: 'bandcamp' },
		title: 'Bandcamp',
		icon: BandcampIcon,
	},
	{
		name: 'behance',
		attributes: { service: 'behance' },
		title: 'Behance',
		icon: BehanceIcon,
	},
	{
		name: 'bluesky',
		attributes: { service: 'bluesky' },
		title: 'Bluesky',
		icon: BlueskyIcon,
	},
	{
		name: 'chain',
		attributes: { service: 'chain' },
		title: 'Link',
		icon: ChainIcon,
	},
	{
		name: 'codepen',
		attributes: { service: 'codepen' },
		title: 'CodePen',
		icon: CodepenIcon,
	},
	{
		name: 'deviantart',
		attributes: { service: 'deviantart' },
		title: 'DeviantArt',
		icon: DeviantArtIcon,
	},
	{
		name: 'dribbble',
		attributes: { service: 'dribbble' },
		title: 'Dribbble',
		icon: DribbbleIcon,
	},
	{
		name: 'dropbox',
		attributes: { service: 'dropbox' },
		title: 'Dropbox',
		icon: DropboxIcon,
	},
	{
		name: 'etsy',
		attributes: { service: 'etsy' },
		title: 'Etsy',
		icon: EtsyIcon,
	},
	{
		name: 'facebook',
		attributes: { service: 'facebook' },
		title: 'Facebook',
		icon: FacebookIcon,
	},
	{
		name: 'feed',
		attributes: { service: 'feed' },
		title: 'RSS Feed',
		icon: FeedIcon,
	},
	{
		name: 'flickr',
		attributes: { service: 'flickr' },
		title: 'Flickr',
		icon: FlickrIcon,
	},
	{
		name: 'foursquare',
		attributes: { service: 'foursquare' },
		title: 'Foursquare',
		icon: FoursquareIcon,
	},
	{
		name: 'goodreads',
		attributes: { service: 'goodreads' },
		title: 'Goodreads',
		icon: GoodreadsIcon,
	},
	{
		name: 'google',
		attributes: { service: 'google' },
		title: 'Google',
		icon: GoogleIcon,
	},
	{
		name: 'github',
		attributes: { service: 'github' },
		title: 'GitHub',
		icon: GitHubIcon,
	},
	{
		name: 'gravatar',
		attributes: { service: 'gravatar' },
		title: 'Gravatar',
		icon: GravatarIcon,
	},
	{
		name: 'instagram',
		attributes: { service: 'instagram' },
		title: 'Instagram',
		icon: InstagramIcon,
	},
	{
		name: 'lastfm',
		attributes: { service: 'lastfm' },
		title: 'Last.fm',
		icon: LastfmIcon,
	},
	{
		name: 'linkedin',
		attributes: { service: 'linkedin' },
		title: 'LinkedIn',
		icon: LinkedInIcon,
	},
	{
		name: 'mail',
		attributes: { service: 'mail' },
		title: 'Mail',
		keywords: [ 'email', 'e-mail' ],
		icon: MailIcon,
	},
	{
		name: 'mastodon',
		attributes: { service: 'mastodon' },
		title: 'Mastodon',
		icon: MastodonIcon,
	},
	{
		name: 'meetup',
		attributes: { service: 'meetup' },
		title: 'Meetup',
		icon: MeetupIcon,
	},
	{
		name: 'medium',
		attributes: { service: 'medium' },
		title: 'Medium',
		icon: MediumIcon,
	},
	{
		name: 'patreon',
		attributes: { service: 'patreon' },
		title: 'Patreon',
		icon: PatreonIcon,
	},
	{
		name: 'pinterest',
		attributes: { service: 'pinterest' },
		title: 'Pinterest',
		icon: PinterestIcon,
	},
	{
		name: 'pocket',
		attributes: { service: 'pocket' },
		title: 'Pocket',
		icon: PocketIcon,
	},
	{
		name: 'reddit',
		attributes: { service: 'reddit' },
		title: 'Reddit',
		icon: RedditIcon,
	},
	{
		name: 'skype',
		attributes: { service: 'skype' },
		title: 'Skype',
		icon: SkypeIcon,
	},
	{
		name: 'snapchat',
		attributes: { service: 'snapchat' },
		title: 'Snapchat',
		icon: SnapchatIcon,
	},
	{
		name: 'soundcloud',
		attributes: { service: 'soundcloud' },
		title: 'SoundCloud',
		icon: SoundCloudIcon,
	},
	{
		name: 'spotify',
		attributes: { service: 'spotify' },
		title: 'Spotify',
		icon: SpotifyIcon,
	},
	{
		name: 'telegram',
		attributes: { service: 'telegram' },
		title: 'Telegram',
		icon: TelegramIcon,
	},
	{
		name: 'threads',
		attributes: { service: 'threads' },
		title: 'Threads',
		icon: ThreadsIcon,
	},
	{
		name: 'tiktok',
		attributes: { service: 'tiktok' },
		title: 'TikTok',
		icon: TiktokIcon,
	},
	{
		name: 'tumblr',
		attributes: { service: 'tumblr' },
		title: 'Tumblr',
		icon: TumblrIcon,
	},
	{
		name: 'twitch',
		attributes: { service: 'twitch' },
		title: 'Twitch',
		icon: TwitchIcon,
	},
	{
		name: 'twitter',
		attributes: { service: 'twitter' },
		title: 'Twitter',
		icon: TwitterIcon,
	},
	{
		name: 'vimeo',
		attributes: { service: 'vimeo' },
		title: 'Vimeo',
		icon: VimeoIcon,
	},
	{
		name: 'vk',
		attributes: { service: 'vk' },
		title: 'VK',
		icon: VkIcon,
	},
	{
		name: 'whatsapp',
		attributes: { service: 'whatsapp' },
		title: 'WhatsApp',
		icon: WhatsAppIcon,
	},
	{
		name: 'x',
		attributes: { service: 'x' },
		keywords: [ 'twitter' ],
		title: 'X',
		icon: XIcon,
	},
	{
		name: 'yelp',
		attributes: { service: 'yelp' },
		title: 'Yelp',
		icon: YelpIcon,
	},
	{
		name: 'youtube',
		attributes: { service: 'youtube' },
		title: 'YouTube',
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
