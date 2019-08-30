/**
 * Internal dependencies
 */
import {
	AmazonIcon,
	BandcampIcon,
	BehanceIcon,
	ChainIcon,
	CodepenIcon,
	DeviantartIcon,
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
	GithubIcon,
	InstagramIcon,
	LastfmIcon,
	LinkedinIcon,
	MailIcon,
	MastodonIcon,
	MeetupIcon,
	MediumIcon,
	PinterestIcon,
	PocketIcon,
	RedditIcon,
	SkypeIcon,
	SnapchatIcon,
	SoundcloudIcon,
	SpotifyIcon,
	TumblrIcon,
	TwitchIcon,
	TwitterIcon,
	VimeoIcon,
	VkIcon,
	WordPressIcon,
	YelpIcon,
	YoutubeIcon,
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
		icon: DeviantartIcon,
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
		name: 'Github',
		icon: GithubIcon,
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
		name: 'Linkedin',
		icon: LinkedinIcon,
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
		name: 'Soundcloud',
		icon: SoundcloudIcon,
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
		icon: YoutubeIcon,
	},
};

export default socialList;

export const getIconBySite = ( site ) => {
	return socialList[ site ].icon;
};
