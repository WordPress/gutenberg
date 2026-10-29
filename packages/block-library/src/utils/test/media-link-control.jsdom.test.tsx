import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { useDispatch } from '@wordpress/data';
import { useSelect } from '@wordpress/data';
import {
	MediaLinkControl,
	MediaLinkNewTabControl,
} from '../media-link-control';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockScrollIntoView();

/**
 * Presses Enter in an element. `user.keyboard( '[Enter]' )` sends a `keyCode`
 * of `0`, which `URLInput` ignores.
 *
 * @param element Element to press Enter in.
 */
function triggerEnter( element: Element ) {
	fireEvent.keyDown( element, {
		key: 'Enter',
		keyCode: 13,
	} );
}

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// The stub stands in for every store's actions.
	useDispatch: ( () => ( {} ) ) as unknown as typeof useDispatch,
	useSelect: vi.fn(),
} ) );

// The preview's rich data and badges are covered by its own tests.
vi.mock( import( '../link-picker' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useLinkPreview: ( { url }: { url?: string | null } ) => ( {
		title: url || 'Add link',
		url: url ?? '',
		image: null,
		badges: [],
	} ),
} ) );

const MEDIA_URL = 'https://example.com/wp-content/uploads/image.jpg';
const MEDIA_LINK = 'https://example.com/?attachment_id=1';

function getLinkTo() {
	return screen.getByRole( 'combobox', { name: 'Link to' } );
}

function getOptionLabels() {
	return within( getLinkTo() )
		.getAllByRole( 'option' )
		.map( ( option ) => option.textContent );
}

describe( 'MediaLinkControl', () => {
	beforeEach( () => {
		( useSelect as Mock ).mockReturnValue( {
			fetchSearchSuggestions: () => Promise.resolve( [] ),
		} );
	} );

	test( 'offers no link, the media file, the attachment page and a custom URL', () => {
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				onChange={ vi.fn() }
			/>
		);

		expect( getOptionLabels() ).toEqual( [
			'None',
			'Media file',
			'Attachment page',
			'Custom URL',
		] );
		expect( getLinkTo() ).toHaveValue( 'none' );
	} );

	test( 'does not offer the attachment page when the media has none', () => {
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				onChange={ vi.fn() }
			/>
		);

		expect( getOptionLabels() ).toEqual( [
			'None',
			'Media file',
			'Custom URL',
		] );
	} );

	test( 'offers only the destinations it is given', () => {
		render(
			<MediaLinkControl
				href={ MEDIA_URL }
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				destinations={ [ 'media', 'attachment' ] }
				onChange={ vi.fn() }
			/>
		);

		expect( getOptionLabels() ).toEqual( [
			'Media file',
			'Attachment page',
		] );
	} );

	test.each( [
		[ MEDIA_URL, 'media' ],
		[ MEDIA_LINK, 'attachment' ],
	] )(
		'works out the destination of %s when no destination is given',
		( href, expected ) => {
			render(
				<MediaLinkControl
					href={ href }
					mediaUrl={ MEDIA_URL }
					mediaLink={ MEDIA_LINK }
					destinations={ [ 'media', 'attachment' ] }
					onChange={ vi.fn() }
				/>
			);

			expect( getLinkTo() ).toHaveValue( expected );
		}
	);

	test.each( [
		[ 'None', 'media', { href: undefined, linkDestination: 'none' } ],
		[ 'Media file', 'none', { href: MEDIA_URL, linkDestination: 'media' } ],
		[
			'Attachment page',
			'none',
			{ href: MEDIA_LINK, linkDestination: 'attachment' },
		],
	] )(
		'links to the destination when %s is chosen',
		async ( label, linkDestination, expected ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<MediaLinkControl
					linkDestination={ linkDestination }
					href={ linkDestination === 'media' ? MEDIA_URL : undefined }
					mediaUrl={ MEDIA_URL }
					mediaLink={ MEDIA_LINK }
					onChange={ onChange }
				/>
			);

			await user.selectOptions( getLinkTo(), label );

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( expected );
		}
	);

	test( 'shows the custom URL in a link picker', () => {
		render(
			<MediaLinkControl
				linkDestination="custom"
				href="https://wordpress.org"
				mediaUrl={ MEDIA_URL }
				onChange={ vi.fn() }
			/>
		);

		expect( getLinkTo() ).toHaveValue( 'custom' );
		expect(
			screen.getByRole( 'button', { name: /URL/ } )
		).toHaveTextContent( 'https://wordpress.org' );
	} );

	test( 'does not show a link picker for the other destinations', () => {
		render(
			<MediaLinkControl
				linkDestination="media"
				href={ MEDIA_URL }
				mediaUrl={ MEDIA_URL }
				onChange={ vi.fn() }
			/>
		);

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	test( 'links to a custom URL chosen in the link picker', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				onChange={ onChange }
			/>
		);

		await user.selectOptions( getLinkTo(), 'Custom URL' );

		// Choosing Custom URL waits for a URL before changing the link.
		expect( onChange ).not.toHaveBeenCalled();
		expect( getLinkTo() ).toHaveValue( 'custom' );

		await user.click( screen.getByRole( 'button', { name: /URL/ } ) );
		const urlInput = await screen.findByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await user.type( urlInput, 'https://wordpress.org' );
		triggerEnter( urlInput );

		expect( onChange ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).toHaveBeenCalledWith( {
			href: 'https://wordpress.org',
			linkDestination: 'custom',
		} );
	} );

	test( 'links to the media file when its URL is chosen as a custom URL', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkControl
				linkDestination="custom"
				href="https://wordpress.org"
				mediaUrl={ MEDIA_URL }
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: /URL/ } ) );
		const urlInput = await screen.findByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await user.type( urlInput, `${ MEDIA_URL }` );
		triggerEnter( urlInput );

		expect( onChange ).toHaveBeenCalledWith( {
			href: MEDIA_URL,
			linkDestination: 'media',
		} );
	} );
} );

describe( 'MediaLinkNewTabControl', () => {
	function getNewTab() {
		return screen.getByRole( 'checkbox', { name: 'Open in new tab' } );
	}

	test( 'is checked when the link opens in a new tab', () => {
		render(
			<MediaLinkNewTabControl linkTarget="_blank" onChange={ vi.fn() } />
		);

		expect( getNewTab() ).toBeChecked();
	} );

	test( 'opens the link in a new tab with noopener', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkNewTabControl rel="nofollow" onChange={ onChange } />
		);

		await user.click( getNewTab() );

		expect( onChange ).toHaveBeenCalledWith( {
			linkTarget: '_blank',
			rel: 'nofollow noopener',
		} );
	} );

	test( 'stops opening the link in a new tab and removes noopener', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkNewTabControl
				linkTarget="_blank"
				rel="nofollow noopener"
				onChange={ onChange }
			/>
		);

		await user.click( getNewTab() );

		expect( onChange ).toHaveBeenCalledWith( {
			linkTarget: undefined,
			rel: 'nofollow',
		} );
	} );
} );
