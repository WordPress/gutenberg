import { describe, expect, it } from 'vitest';
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

	it( 'keeps the query a p carries, for the route to read as search', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Freports%3Fperiod%3D7d',
				BASE
			)
		).toBe( '/reports?period=7d' );
	} );

	it( 'keeps a comma-separated list, which both navigations read as text', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fsite-health%3Fstatus%3Dcritical%2Crecommended',
				BASE
			)
		).toBe( '/site-health?status=critical,recommended' );
	} );

	it( 'rejects a p query with a repeated key', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fposts%3Fstatus%3Ddraft%26status%3Dpending',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p query value the router reads as a number', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fposts%3Fauthor%3D12',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p query value the router reads as a boolean', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fposts%3Fsticky%3Dtrue',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p query value the router reads as JSON', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fposts%3Fview%3D%7B%22type%22%3A%22table%22%7D',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p query value the router reads as a quoted string', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%2Fposts%3Fq%3D%227%22',
				BASE
			)
		).toBeNull();
	} );

	it( 'rejects a p that is only a query', () => {
		expect(
			matchDashboardHref(
				'admin.php?page=dashboard&p=%3Fperiod%3D7d',
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
