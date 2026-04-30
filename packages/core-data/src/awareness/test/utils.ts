/**
 * Internal dependencies
 */
import { areCollaboratorInfosEqual, generateCollaboratorInfo } from '../utils';
import type { CollaboratorInfo } from '../types';
import type { User } from '../../entity-types';

// Mock window.navigator.userAgent
const mockUserAgent = ( userAgent: string ) => {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: userAgent,
		configurable: true,
	} );
};

describe( 'Awareness Utils', () => {
	describe( 'arecollaboratorInfosEqual', () => {
		// Shared avatar_urls reference for equality checks
		// (arecollaboratorInfosEqual uses === which compares references for objects)
		const sharedAvatarUrls = {
			'24': 'https://example.com/avatar-24.png',
			'48': 'https://example.com/avatar-48.png',
			'96': 'https://example.com/avatar-96.png',
		};

		const createCollaboratorInfo = (
			overrides: Partial< CollaboratorInfo > = {}
		): CollaboratorInfo => ( {
			id: 1,
			name: 'Test User',
			slug: 'test-user',
			avatar_urls: sharedAvatarUrls,
			browserType: 'Chrome',
			enteredAt: 1704067200000,
			...overrides,
		} );

		test( 'should return true when both collaboratorInfos are undefined', () => {
			expect( areCollaboratorInfosEqual( undefined, undefined ) ).toBe(
				true
			);
		} );

		test( 'should return false when first collaboratorInfo is undefined', () => {
			const collaboratorInfo = createCollaboratorInfo();
			expect(
				areCollaboratorInfosEqual( undefined, collaboratorInfo )
			).toBe( false );
		} );

		test( 'should return false when second collaboratorInfo is undefined', () => {
			const collaboratorInfo = createCollaboratorInfo();
			expect(
				areCollaboratorInfosEqual( collaboratorInfo, undefined )
			).toBe( false );
		} );

		test( 'should return true when collaboratorInfos are identical', () => {
			const collaboratorInfo1 = createCollaboratorInfo();
			const collaboratorInfo2 = createCollaboratorInfo();
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( true );
		} );

		test( 'should return false when id differs', () => {
			const collaboratorInfo1 = createCollaboratorInfo( { id: 1 } );
			const collaboratorInfo2 = createCollaboratorInfo( { id: 2 } );
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );

		test( 'should return false when name differs', () => {
			const collaboratorInfo1 = createCollaboratorInfo( {
				name: 'User A',
			} );
			const collaboratorInfo2 = createCollaboratorInfo( {
				name: 'User B',
			} );
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );

		test( 'should return false when slug differs', () => {
			const collaboratorInfo1 = createCollaboratorInfo( {
				slug: 'user-a',
			} );
			const collaboratorInfo2 = createCollaboratorInfo( {
				slug: 'user-b',
			} );
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );

		test( 'should return false when browserType differs', () => {
			const collaboratorInfo1 = createCollaboratorInfo( {
				browserType: 'Chrome',
			} );
			const collaboratorInfo2 = createCollaboratorInfo( {
				browserType: 'Firefox',
			} );
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );

		test( 'should return false when enteredAt differs', () => {
			const collaboratorInfo1 = createCollaboratorInfo( {
				enteredAt: 1000,
			} );
			const collaboratorInfo2 = createCollaboratorInfo( {
				enteredAt: 2000,
			} );
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );

		test( 'should return false when objects have different number of keys', () => {
			const collaboratorInfo1 = createCollaboratorInfo();
			// Create collaboratorInfo2 with an extra key by casting
			const collaboratorInfo2 = {
				...createCollaboratorInfo(),
				extraKey: 'extra',
			} as unknown as CollaboratorInfo;
			expect(
				areCollaboratorInfosEqual(
					collaboratorInfo1,
					collaboratorInfo2
				)
			).toBe( false );
		} );
	} );

	describe( 'generateCollaboratorInfo', () => {
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

		test( 'should generate collaboratorInfo with user properties', () => {
			const user = createMockUser( { id: 42, name: 'Jane Doe' } );
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.id ).toBe( 42 );
			expect( collaboratorInfo.name ).toBe( 'Jane Doe' );
			expect( collaboratorInfo.slug ).toBe( 'test-user' );
		} );

		test( 'should include browser type', () => {
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Chrome' );
		} );

		test( 'should detect Firefox browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Firefox' );
		} );

		test( 'should detect Microsoft Edge browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Microsoft Edge' );
		} );

		test( 'should detect Safari browser', () => {
			mockUserAgent(
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Safari' );
		} );

		test( 'should detect Internet Explorer browser (MSIE)', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; SLCC2; .NET CLR 2.0.50727; MSIE 10.0; rv:11.0) like Gecko'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Internet Explorer' );
		} );

		test( 'should detect Internet Explorer browser (Trident)', () => {
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Internet Explorer' );
		} );

		test( 'should detect Opera browser (Opera)', () => {
			mockUserAgent(
				'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Opera' );
		} );

		test( 'should detect Opera browser (OPR)', () => {
			// Note: Modern Opera (Chromium-based) includes both "Chrome" and "Safari"
			// in the user agent. The browser detection checks Chrome and Safari before
			// OPR, so we use a synthetic user agent to test the OPR detection path.
			mockUserAgent(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OPR/77.0.4054.203'
			);
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Opera' );
		} );

		test( 'should return Unknown for unrecognized browser', () => {
			mockUserAgent( 'Some Unknown Browser/1.0' );
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.browserType ).toBe( 'Unknown' );
		} );

		test( 'should include enteredAt timestamp', () => {
			const user = createMockUser();
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.enteredAt ).toBe( 1704067200000 );
		} );

		test( 'should include avatar_urls from user', () => {
			const user = createMockUser( {
				avatar_urls: {
					'24': 'https://example.com/small.png',
					'48': 'https://example.com/medium.png',
					'96': 'https://example.com/large.png',
				},
			} );
			const collaboratorInfo = generateCollaboratorInfo( user );

			expect( collaboratorInfo.avatar_urls ).toEqual( {
				'24': 'https://example.com/small.png',
				'48': 'https://example.com/medium.png',
				'96': 'https://example.com/large.png',
			} );
		} );
	} );
} );
