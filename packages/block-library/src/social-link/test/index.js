/**
 * Internal dependencies
 */
import { getMatchingService } from '../social-list';

const fixtures = [
	[ 'https://profiles.wordpress.org/exampleuser', 'wordpress' ],
	[ 'https://exampleuser.wordpress.com/', 'wordpress' ],
	[ 'https://www.instagram.com/exampleuser/', 'instagram' ],
	[ 'https://www.tiktok.com/@exampleuser', 'tiktok' ],
	[ 'https://twitter.com/exampleuser', 'twitter' ],
	[ 'https://x.com/exampleuser', 'x' ],
	[ 'https://www.facebook.com/exampleuser', 'facebook' ],
	[ 'https://www.linkedin.com/in/exampleuser', 'linkedin' ],
	[ 'https://www.pinterest.com/exampleuser', 'pinterest' ],
	[ 'https://www.snapchat.com/add/exampleuser', 'snapchat' ],
	[ 'https://exampleuser.tumblr.com/', 'tumblr' ],
	[ 'https://www.reddit.com/user/exampleuser', 'reddit' ],
	[ 'https://www.goodreads.com/user/show/12345678-exampleuser', 'goodreads' ],
	[ 'https://exampleuser.deviantart.com/', 'deviantart' ],
	[ 'https://www.flickr.com/photos/exampleuser', 'flickr' ],
	[ 'https://www.behance.net/exampleuser', 'behance' ],
	[ 'https://soundcloud.com/exampleuser', 'soundcloud' ],
	[ 'https://www.twitch.tv/exampleuser', 'twitch' ],
	[ 'https://www.youtube.com/user/exampleuser', 'youtube' ],
	[ 'https://vimeo.com/exampleuser', 'vimeo' ],
	[ 'https://www.amazon.com/gp/profile/exampleuser', 'amazon' ],
	[ 'https://www.amazon.de/gp/profile/exampleuser', 'amazon' ],
	[ 'https://www.etsy.com/shop/ExampleShop', 'etsy' ],
	[ 'https://www.etsy.com/people/exampleuser', 'etsy' ],
	[ 'https://exampleuser.bandcamp.com/', 'bandcamp' ],
	[ 'https://dribbble.com/exampleuser', 'dribbble' ],
	[ 'https://www.dropbox.com/home/Example_User', 'dropbox' ],
	[ 'https://codepen.io/exampleuser', 'codepen' ],
	[ 'https://www.yelp.com/user_details?userid=exampleuser', 'yelp' ],
	[ 'https://vk.com/id12345678', 'vk' ],
	[ 'https://t.me/exampleuser', 'telegram' ],
	[ 'https://open.spotify.com/user/exampleuser', 'spotify' ],
	[ 'https://getpocket.com/@exampleuser', 'pocket' ],
	[ 'https://www.patreon.com/exampleuser', 'patreon' ],
	[ 'https://medium.com/@exampleuser', 'medium' ],
	[ 'https://www.meetup.com/members/12345678/', 'meetup' ],
	[ 'https://github.com/exampleuser', 'github' ],
	[ 'https://www.gravatar.com/avatar/{example_hash}', 'gravatar' ],
	[ 'https://www.last.fm/user/exampleuser', 'lastfm' ],
	[ 'https://foursquare.com/user/exampleuser', 'foursquare' ],
	[ 'https://join.skype.com/invite/exampleuser', 'skype' ],
	[ 'https://www.threads.net/@exampleuser', 'threads' ],
	[ 'https://example.com/feed/', 'feed' ],
	[ 'https://500px.com/p/exampleuser?view=photos', 'fivehundredpx' ],
];

describe( 'Utils', () => {
	describe( 'getMatchingService', () => {
		it.each( fixtures )(
			'should return the matching service for %s',
			( url, expected ) => {
				expect( getMatchingService( url ) ).toBe( expected );
			}
		);
	} );
} );
