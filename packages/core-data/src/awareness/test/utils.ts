/**
 * Internal dependencies
 */
import { areUserInfosEqual, generateUserInfo } from '../utils';
import type { UserInfo } from '../types';
import type { User } from '../../entity-types';

// Mock window.navigator.userAgent
const mockUserAgent = ( userAgent: string ) => {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: userAgent,
		configurable: true,
	} );
};

describe( 'Awareness Utils', () => {
	describe( 'areUserInfosEqual', () => {
		// Shared avatar_urls reference for equality checks
		// (areUserInfosEqual uses === which compares references for objects)
		const sharedAvatarUrls = {
			'24': 'https://example.com/avatar-24.png',
			'48': 'https://example.com/avatar-48.png',
			'96': 'https://example.com/avatar-96.png',
		};

		const createUserInfo = (
			overrides: Partial< UserInfo > = {}
		): UserInfo => ( {
			id: 1,
			name: 'Test User',
			slug: 'test-user',
			avatar_urls: sharedAvatarUrls,
			browserType: 'Chrome',
			color: '#3858E9',
			enteredAt: 1704067200000,
			...overrides,
		} );

		test( 'should return true when both userInfos are undefined', () => {
			expect( areUserInfosEqual( undefined, undefined ) ).toBe( true );
		} );

		test( 'should return false when first userInfo is undefined', () => {
			const userInfo = createUserInfo();
			expect( areUserInfosEqual( undefined, userInfo ) ).toBe( false );
		} );

		test( 'should return false when second userInfo is undefined', () => {
			const userInfo = createUserInfo();
			expect( areUserInfosEqual( userInfo, undefined ) ).toBe( false );
		} );

		test( 'should return true when userInfos are identical', () => {
			const userInfo1 = createUserInfo();
			const userInfo2 = createUserInfo();
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( true );
		} );

		test( 'should return false when id differs', () => {
			const userInfo1 = createUserInfo( { id: 1 } );
			const userInfo2 = createUserInfo( { id: 2 } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when name differs', () => {
			const userInfo1 = createUserInfo( { name: 'User A' } );
			const userInfo2 = createUserInfo( { name: 'User B' } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when slug differs', () => {
			const userInfo1 = createUserInfo( { slug: 'user-a' } );
			const userInfo2 = createUserInfo( { slug: 'user-b' } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when browserType differs', () => {
			const userInfo1 = createUserInfo( { browserType: 'Chrome' } );
			const userInfo2 = createUserInfo( { browserType: 'Firefox' } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when color differs', () => {
			const userInfo1 = createUserInfo( { color: '#3858E9' } );
			const userInfo2 = createUserInfo( { color: '#B42AED' } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when enteredAt differs', () => {
			const userInfo1 = createUserInfo( { enteredAt: 1000 } );
			const userInfo2 = createUserInfo( { enteredAt: 2000 } );
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );

		test( 'should return false when objects have different number of keys', () => {
			const userInfo1 = createUserInfo();
			// Create userInfo2 with an extra key by casting
			const userInfo2 = {
				...createUserInfo(),
				extraKey: 'extra',
			} as unknown as UserInfo;
			expect( areUserInfosEqual( userInfo1, userInfo2 ) ).toBe( false );
		} );
	} );

	describe( 'generateUserInfo', () => {
		const createMockUser = (
			overrides: Partial< User< 'view' > > = {}
		): User< 'view' > =>
			( {
				id: 1,
				name: 'Test User',
				slug: 'test-user',
				avatar_urls: {
					'24': 'https://example.com/avatar-24.png',
					'48': 'https://example.com/avatar-48.png',
					'96': 'https://example.com/avatar-96.png',
				},
				...overrides,
			} ) as User< 'view' >;

		beforeEach( () => {
			// Reset to Chrome by default
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			);
			jest.spyOn( Date, 'now' ).mockReturnValue( 1704067200000 );
		} );

		afterEach( () => {
			jest.restoreAllMocks();
		} );

		test( 'should generate userInfo with user properties', () => {
			const user = createMockUser( { id: 42, name: 'Jane Doe' } );
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.id ).toBe( 42 );
			expect( userInfo.name ).toBe( 'Jane Doe' );
			expect( userInfo.slug ).toBe( 'test-user' );
		} );

		test( 'should include browser type', () => {
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Chrome' );
		} );

		test( 'should detect Firefox browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Firefox' );
		} );

		test( 'should detect Microsoft Edge browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Microsoft Edge' );
		} );

		test( 'should detect Safari browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Safari' );
		} );

		test( 'should detect Internet Explorer browser (MSIE)', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; MSIE 10.0; rv:11.0) like Gecko'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Internet Explorer' );
		} );

		test( 'should detect Internet Explorer browser (Trident)', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Internet Explorer' );
		} );

		test( 'should detect Opera browser (Opera)', () => {
			mockUserAgent(
				'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Opera' );
		} );

		test( 'should detect Opera browser (OPR)', () => {
			// Note: Modern Opera (Chromium-based) includes both "Chrome" and "Safari"
			// in the user agent. The browser detection checks Chrome and Safari before
			// OPR, so we use a synthetic user agent to test the OPR detection path.
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OPR/77.0.4054.203'
			);
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Opera' );
		} );

		test( 'should return Unknown for unrecognized browser', () => {
			mockUserAgent( 'Some Unknown Browser/1.0' );
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.browserType ).toBe( 'Unknown' );
		} );

		test( 'should include enteredAt timestamp', () => {
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.enteredAt ).toBe( 1704067200000 );
		} );

		test( 'should assign a color from the palette when no existing colors', () => {
			const user = createMockUser();
			const userInfo = generateUserInfo( user, [] );

			const colorPalette = [
				'#3858E9',
				'#B42AED',
				'#E33184',
				'#F3661D',
				'#ECBD3A',
				'#97FE17',
				'#00FDD9',
				'#37C5F0',
			];
			expect( colorPalette ).toContain( userInfo.color );
		} );

		test( 'should avoid existing colors when assigning', () => {
			const user = createMockUser();
			const existingColors = [
				'#3858E9',
				'#B42AED',
				'#E33184',
				'#F3661D',
				'#ECBD3A',
				'#97FE17',
				'#00FDD9',
			];
			const userInfo = generateUserInfo( user, existingColors );

			// The only available color from the palette is #37C5F0 (cyan)
			expect( userInfo.color ).toBe( '#37C5F0' );
		} );

		test( 'should generate color variation when all palette colors are in use', () => {
			const user = createMockUser();
			const existingColors = [
				'#3858E9',
				'#B42AED',
				'#E33184',
				'#F3661D',
				'#ECBD3A',
				'#97FE17',
				'#00FDD9',
				'#37C5F0',
			];
			const userInfo = generateUserInfo( user, existingColors );

			// Should be a valid hex color
			expect( userInfo.color ).toMatch( /^#[0-9A-F]{6}$/i );
			// And should not be one of the original colors
			// (it's a variation so could be close but not exactly the same in most cases)
		} );

		test( 'should include avatar_urls from user', () => {
			const user = createMockUser( {
				avatar_urls: {
					'24': 'https://example.com/small.png',
					'48': 'https://example.com/medium.png',
					'96': 'https://example.com/large.png',
				},
			} );
			const userInfo = generateUserInfo( user, [] );

			expect( userInfo.avatar_urls ).toEqual( {
				'24': 'https://example.com/small.png',
				'48': 'https://example.com/medium.png',
				'96': 'https://example.com/large.png',
			} );
		} );
	} );
} );
