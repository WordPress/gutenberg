import { matchDashboardHref } from '../match-dashboard-href';

const BASE = 'https://example.com/wp-admin/admin.php?page=dashboard&p=/';

describe( 'matchDashboardHref', () => {
	it( 'matches an absolute href to this page and extracts the route', () => {
		expect(
			matchDashboardHref(
				'https://example.com/wp-admin/admin.php?page=dashboard&p=/site-health',
				BASE
			)
		).toEqual( { to: '/site-health' } );
	} );

	it( 'matches a relative href that carries the same page', () => {
		expect(
			matchDashboardHref( 'admin.php?page=dashboard&p=/reports', BASE )
		).toEqual( { to: '/reports' } );
	} );

	it( 'defaults to the root route when p is absent', () => {
		expect(
			matchDashboardHref( 'admin.php?page=dashboard', BASE )
		).toEqual( { to: '/' } );
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

	it( 'rejects an unparsable base', () => {
		expect( matchDashboardHref( 'admin.php', 'not a url' ) ).toBeNull();
	} );
} );
