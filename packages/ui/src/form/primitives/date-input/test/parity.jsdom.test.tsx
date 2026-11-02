import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateInput } from '../date-input';
import { ReactAriaDateInput } from './fixtures/react-aria-date-input';

const locales = [
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
];

async function edit(
	implementation: 'reference' | 'first-party',
	locale: string,
	segment: number,
	keys: string
) {
	const change = vi.fn();
	const user = userEvent.setup();
	const { unmount } = render(
		implementation === 'reference' ? (
			<ReactAriaDateInput locale={ locale } onValueChange={ change } />
		) : (
			<DateInput
				locale={ locale }
				aria-label="Date"
				defaultValue="2026-01-20"
				onValueChange={ change }
			/>
		)
	);
	await user.click( screen.getAllByRole( 'spinbutton' )[ segment ] );
	await user.keyboard( keys );
	const result = {
		focusedSegment: screen
			.getAllByRole( 'spinbutton' )
			.findIndex( ( element ) => element.matches( ':focus' ) ),
		values: screen
			.getAllByRole( 'spinbutton' )
			.map( ( element ) => element.getAttribute( 'aria-valuenow' ) ),
		changes: change.mock.calls.map( ( [ value ] ) => value ),
	};
	unmount();
	return result;
}

describe( 'DateInput independent React Aria benchmark', () => {
	it.each(
		locales.flatMap( ( locale ) =>
			[ 0, 1, 2 ].map( ( segment ) => ( { locale, segment } ) )
		)
	)(
		'matches numeric stepping of segment $segment in $locale',
		async ( { locale, segment } ) => {
			const expected = await edit(
				'reference',
				locale,
				segment,
				'{ArrowUp}{ArrowDown}'
			);
			expect(
				await edit(
					'first-party',
					locale,
					segment,
					'{ArrowUp}{ArrowDown}'
				)
			).toEqual( expected );
		}
	);

	it.each(
		[ 0, 1, 2 ].flatMap( ( segment ) =>
			[
				'{Home}',
				'{End}',
				'{PageUp}',
				'{PageDown}',
				'{Backspace}',
				'{Delete}',
			].map( ( keys ) => ( { segment, keys } ) )
		)
	)( 'matches $keys in segment $segment', async ( { segment, keys } ) => {
		const expected = await edit( 'reference', 'en-US', segment, keys );
		expect( await edit( 'first-party', 'en-US', segment, keys ) ).toEqual(
			expected
		);
	} );

	it.each( locales )(
		'matches numeric replacement in %s',
		async ( locale ) => {
			const expected = await edit( 'reference', locale, 0, '05' );
			expect( await edit( 'first-party', locale, 0, '05' ) ).toEqual(
				expected
			);
		}
	);

	it.each(
		[ 0, 1, 2 ].flatMap( ( segment ) =>
			[
				'{ArrowUp}05',
				'{Backspace}5',
				'{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}',
				'{ArrowLeft}{ArrowRight}',
			].map( ( keys ) => ( { segment, keys } ) )
		)
	)(
		'matches focus and mixed editing $keys in segment $segment',
		async ( { segment, keys } ) => {
			const expected = await edit( 'reference', 'en-US', segment, keys );
			expect(
				await edit( 'first-party', 'en-US', segment, keys )
			).toEqual( expected );
		}
	);
} );
