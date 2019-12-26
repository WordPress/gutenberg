/**
 * Internal dependencies
 */
import {
	AmazonIcon,
	BandcampIcon,
	BehanceIcon,
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
	InstagramIcon,
	LastfmIcon,
	LinkedInIcon,
	MailIcon,
	MastodonIcon,
	MeetupIcon,
	MediumIcon,
	PinterestIcon,
	PocketIcon,
	RedditIcon,
	SkypeIcon,
	SnapchatIcon,
	SoundCloudIcon,
	SpotifyIcon,
	TumblrIcon,
	TwitchIcon,
	TwitterIcon,
	VimeoIcon,
	VkIcon,
	WordPressIcon,
	YelpIcon,
	YouTubeIcon,
} from './icons';

const socialList = {
	fivehundredpx: {
		name: '500px',
		icon: FivehundredpxIcon,
	},
	amazon: {
		name: 'Amazon',
		icon: AmazonIcon,
	},
	bandcamp: {
		name: 'Bandcamp',
		icon: BandcampIcon,
	},
	behance: {
		name: 'Behance',
		icon: BehanceIcon,
	},
	chain: {
		name: 'Link',
		icon: ChainIcon,
	},
	codepen: {
		name: 'CodePen',
		icon: CodepenIcon,
	},
	deviantart: {
		name: 'DeviantArt',
		icon: DeviantArtIcon,
	},
	dribbble: {
		name: 'Dribbble',
		icon: DribbbleIcon,
	},
	dropbox: {
		name: 'Dropbox',
		icon: DropboxIcon,
	},
	etsy: {
		name: 'Etsy',
		icon: EtsyIcon,
	},
	facebook: {
		name: 'Facebook',
		icon: FacebookIcon,
	},
	feed: {
		name: 'RSS Feed',
		icon: FeedIcon,
	},
	flickr: {
		name: 'Flickr',
		icon: FlickrIcon,
	},
	foursquare: {
		name: 'Foursquare',
		icon: FoursquareIcon,
	},
	goodreads: {
		name: 'Goodreads',
		icon: GoodreadsIcon,
	},
	google: {
		name: 'Google',
		icon: GoogleIcon,
	},
	github: {
		name: 'GitHub',
		icon: GitHubIcon,
	},
	instagram: {
		name: 'Instagram',
		icon: InstagramIcon,
	},
	lastfm: {
		name: 'Last.fm',
		icon: LastfmIcon,
	},
	linkedin: {
		name: 'LinkedIn',
		icon: LinkedInIcon,
	},
	mail: {
		name: 'Mail',
		icon: MailIcon,
	},
	mastodon: {
		name: 'Mastodon',
		icon: MastodonIcon,
	},
	meetup: {
		name: 'Meetup',
		icon: MeetupIcon,
	},
	medium: {
		name: 'Medium',
		icon: MediumIcon,
	},
	pinterest: {
		name: 'Pinterest',
		icon: PinterestIcon,
	},
	pocket: {
		name: 'Pocket',
		icon: PocketIcon,
	},
	reddit: {
		name: 'Reddit',
		icon: RedditIcon,
	},
	skype: {
		name: 'Skype',
		icon: SkypeIcon,
	},
	snapchat: {
		name: 'Snapchat',
		icon: SnapchatIcon,
	},
	soundcloud: {
		name: 'SoundCloud',
		icon: SoundCloudIcon,
	},
	spotify: {
		name: 'Spotify',
		icon: SpotifyIcon,
	},
	tumblr: {
		name: 'Tumblr',
		icon: TumblrIcon,
	},
	twitch: {
		name: 'Twitch',
		icon: TwitchIcon,
	},
	twitter: {
		name: 'Twitter',
		icon: TwitterIcon,
	},
	vimeo: {
		name: 'Vimeo',
		icon: VimeoIcon,
	},
	vk: {
		name: 'VK',
		icon: VkIcon,
	},
	wordpress: {
		name: 'WordPress',
		icon: WordPressIcon,
	},
	yelp: {
		name: 'Yelp',
		icon: YelpIcon,
	},
	youtube: {
		name: 'YouTube',
		icon: YouTubeIcon,
	},
};

export default socialList;

/**
 * Retrieves the social service's icon component.
 *
 * @param {string} site key for a social service (lowercase slug)
 *
 * @return {WPComponent} Icon component for social service.
 */
export const getIconBySite = ( site ) => {
	return socialList[ site ].icon;
};

/**
 * Retrieves the display name for the social service.
 *
 * @param {string} site key for a social service (lowercase slug)
 *
 * @return {string} Display name for social service
 */
export const getNameBySite = ( site ) => {
	return socialList[ site ].name;
};
