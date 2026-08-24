import { matchDashboardHref } from '../match-dashboard-href';

const BASE = 'https://example.com/wp-admin/admin.php?page=dashboard&p=/';

describe( 'matchDashboardHref', () => {
	it( 'matches an absolute href to this page and extracts the route', () => {
		expect(
			matchDashboardHref(
				'https://example.com/wp-admin/admin.php?page=dashboard&p=/site-health',
				BASE
			)
		).toBe( '/site-health' );
	} );

	it( 'matches a relative href that carries the same page', () => {
		expect(
			matchDashboardHref( 'admin.php?page=dashboard&p=/reports', BASE )
		).toBe( '/reports' );
	} );

	it( 'defaults to the root route when p is absent', () => {
		expect( matchDashboardHref( 'admin.php?page=dashboard', BASE ) ).toBe(
			'/'
		);
	} );

	it( 'rejects another admin page', () => {
		expect(
			matchDashboardHref( 'admin.php?page=stats&p=/reports', BASE )
		).toBeNull();
	} );

	it( 'rejects another admin entry point', () => {
		expect(
			matchDashboardHref( 'site-health.php?tab=debug', BASE )
		).toBeNull();
	} );

	it( 'rejects another origin', () => {
		expect(
			matchDashboardHref(
				'https://other.example/wp-admin/admin.php?page=dashboard&p=/x',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a href that drops the page param', () => {
		expect( matchDashboardHref( '?p=/reports', BASE ) ).toBeNull();
	} );

	it( 'rejects a href with a hash', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=/reports#section',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a href with search params beyond page and p', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=/reports&period=7d',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p that carries its own query string', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=/reports?period=7d',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p that carries an encoded hash', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=/reports%23section',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p that is an absolute URL', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=https://example.com',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p with a scheme', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=mailto:hello@example.com',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a protocol-relative p', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=//example.com/reports',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a relative p', () => {
		expect(
			matchDashboardHref( 'admin.php?page=dashboard&p=reports', BASE )
		).toBeNull();
	} );

	it( 'rejects a duplicate page parameter', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&page=stats&p=/reports',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a duplicate p parameter', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=/reports&p=/settings',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects an unparsable base', () => {
		expect( matchDashboardHref( 'admin.php', 'not a url' ) ).toBeNull();
	} );
} );
