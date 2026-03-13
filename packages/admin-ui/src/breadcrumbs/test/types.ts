/**
 * Internal dependencies
 */
import type { BreadcrumbsProps } from '../types';

describe( 'Breadcrumbs types', () => {
	it( 'dummy test', () => {
		expect( true ).toBe( true );
	} );

	describe( 'items', () => {
		describe( 'should accept a single item without `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [ { label: 'Home' } ],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept a single item with `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [ { label: 'Home', to: '/' } ],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept multiple items where all preceding items have `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept multiple items where the last item also has `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept an empty items array', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should reject a preceding item without `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					// @ts-expect-error preceding items must have `to`.
					items: [
						{ label: 'Home' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should reject items without a `label`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					// @ts-expect-error items must have a `label`.
					items: [ { to: '/' } ],
				};
				props satisfies BreadcrumbsProps;
			};
		} );
	} );
} );
