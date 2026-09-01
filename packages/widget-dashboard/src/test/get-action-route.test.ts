import type {
	WidgetAction,
	WidgetHostLinks,
} from '@wordpress/widget-primitives';
import { getActionRoute } from '../components/widget-actions/get-action-route';

const MATCHED_HREF = 'admin.php?page=dashboard&p=/reports';

const links: WidgetHostLinks = {
	match: ( href ) => ( href === MATCHED_HREF ? '/reports' : null ),
	Link: () => null,
};

const action: WidgetAction = {
	id: 'report',
	label: 'See report',
	href: MATCHED_HREF,
};

describe( 'getActionRoute', () => {
	it( 'resolves a plain navigation the host recognizes', () => {
		expect( getActionRoute( links, action ) ).toBe( '/reports' );
	} );

	it( 'answers null without a links capability', () => {
		expect( getActionRoute( undefined, action ) ).toBeNull();
	} );

	it( 'answers null for a href the host does not recognize', () => {
		expect(
			getActionRoute( links, { ...action, href: 'https://example.com' } )
		).toBeNull();
	} );

	it.each( [ true, '', 'report.csv' ] )(
		'keeps the plain anchor for download %p',
		( download ) => {
			expect(
				getActionRoute( links, { ...action, download } )
			).toBeNull();
		}
	);

	it( 'treats download false as a navigation', () => {
		expect( getActionRoute( links, { ...action, download: false } ) ).toBe(
			'/reports'
		);
	} );

	it( 'keeps the plain anchor for a new-tab target', () => {
		expect(
			getActionRoute( links, { ...action, openInNewTab: true } )
		).toBeNull();
	} );
} );
