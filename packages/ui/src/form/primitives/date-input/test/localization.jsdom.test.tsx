import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateInput } from '../date-input';

describe( 'DateInput localization', () => {
	it.each( [
		'en-US',
		'en-GB',
		'it-IT',
		'de-DE',
		'fr-FR',
		'ja-JP',
		'zh-CN',
		'ar-EG',
		'fa-IR',
		'he-IL',
		'th-TH',
		'bn-BD',
		'hi-IN',
		'ko-KR',
		'fi-FI',
		'ckb',
		'ug-Latn',
	] )(
		'uses Gregorian numeric segments in the order required by %s',
		( locale ) => {
			render(
				<DateInput
					aria-label="Date"
					defaultValue="2026-01-20"
					locale={ locale }
				/>
			);
			const formatter = new Intl.DateTimeFormat( locale, {
				calendar: 'gregory',
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
				timeZone: 'UTC',
			} );
			const values = { year: '2026', month: '1', day: '20' };
			const order = formatter
				.formatToParts( new Date( '2026-01-20T00:00:00Z' ) )
				.filter(
					( part ) =>
						part.type === 'year' ||
						part.type === 'month' ||
						part.type === 'day'
				)
				.map( ( part ) => values[ part.type as keyof typeof values ] );
			expect(
				screen
					.getAllByRole( 'spinbutton' )
					.map( ( segment ) =>
						segment.getAttribute( 'aria-valuenow' )
					)
			).toEqual( order );
		}
	);

	it( 'displays Arabic numerals and right-to-left direction', () => {
		render(
			<DateInput
				aria-label="Date"
				defaultValue="2026-01-20"
				locale="ar-EG"
			/>
		);
		expect( screen.getByRole( 'group' ) ).toHaveAttribute( 'dir', 'rtl' );
		expect( screen.getByRole( 'group' ) ).toHaveTextContent( '٢٠٢٦' );
	} );
} );
