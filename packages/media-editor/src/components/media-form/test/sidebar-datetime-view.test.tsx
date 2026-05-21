/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import SidebarDatetimeView from '../sidebar-datetime-view';
import type { Media } from '../../media-editor-provider';

function makeField(
	value: string | null | undefined
): NormalizedField< Media > {
	return {
		id: 'date_created',
		type: 'datetime',
		label: 'Date created',
		getValue: () => value,
	} as unknown as NormalizedField< Media >;
}

describe( 'SidebarDatetimeView', () => {
	it( 'exposes the full datetime to assistive tech via aria-label', () => {
		const value = '2026-05-20T14:30:00';
		const settings = getSettings();
		const fullDatetime = dateI18n(
			settings.formats.datetimeAbbreviated,
			getDate( value )
		);

		render(
			<SidebarDatetimeView
				item={ {} as Media }
				field={ makeField( value ) }
			/>
		);

		const rendered = screen.getByLabelText( fullDatetime );
		expect( rendered.tagName ).toBe( 'TIME' );
		expect( rendered ).toHaveAttribute( 'datetime', value );
	} );

	it( 'does not add a tab stop for the datetime anchor', () => {
		const value = '2026-05-20T14:30:00';
		const settings = getSettings();
		const fullDatetime = dateI18n(
			settings.formats.datetimeAbbreviated,
			getDate( value )
		);

		render(
			<SidebarDatetimeView
				item={ {} as Media }
				field={ makeField( value ) }
			/>
		);

		expect( screen.getByLabelText( fullDatetime ) ).toHaveAttribute(
			'tabindex',
			'-1'
		);
	} );

	it( 'shows the short date as visible text', () => {
		const value = '2026-05-20T14:30:00';
		const settings = getSettings();
		const dateOnly = dateI18n( settings.formats.date, getDate( value ) );

		render(
			<SidebarDatetimeView
				item={ {} as Media }
				field={ makeField( value ) }
			/>
		);

		expect( screen.getByText( dateOnly ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when the field value is missing', () => {
		const { container } = render(
			<SidebarDatetimeView
				item={ {} as Media }
				field={ makeField( null ) }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
