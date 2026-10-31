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
	return screen.getByRole( 'button', { name: /Link to/ } );
}

async function openLinkTo( user: ReturnType< typeof userEvent.setup > ) {
	await user.click( getLinkTo() );
	const listbox = await screen.findByRole( 'listbox' );
	return within( listbox ).getAllByRole( 'option' );
}

describe( 'MediaLinkControl', () => {
	beforeEach( () => {
		( useSelect as Mock ).mockReturnValue( {
			fetchSearchSuggestions: () =>
				Promise.resolve( [
					{
						id: 2,
						title: 'About',
						type: 'page',
						kind: 'post-type',
						url: 'https://example.com/about',
					},
				] ),
		} );
	} );

	test( 'has no Link to dropdown', () => {
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				onChange={ vi.fn() }
			/>
		);

		expect( screen.queryByRole( 'combobox' ) ).not.toBeInTheDocument();
	} );

	test.each( [
		[ 'none', undefined, 'Add link' ],
		[ 'media', MEDIA_URL, 'Media file' ],
		[ 'attachment', MEDIA_LINK, 'Attachment page' ],
		[ 'custom', 'https://wordpress.org', 'https://wordpress.org' ],
	] )(
		'shows a %s link in the link preview',
		( linkDestination, href, expected ) => {
			render(
				<MediaLinkControl
					linkDestination={ linkDestination }
					href={ href }
					mediaUrl={ MEDIA_URL }
					mediaLink={ MEDIA_LINK }
					onChange={ vi.fn() }
				/>
			);

			expect( getLinkTo() ).toHaveTextContent( expected );
		}
	);

	test.each( [
		[ MEDIA_URL, 'Media file' ],
		[ MEDIA_LINK, 'Attachment page' ],
	] )(
		'works out the destination of %s when no destination is given',
		( href, expected ) => {
			render(
				<MediaLinkControl
					href={ href }
					mediaUrl={ MEDIA_URL }
					mediaLink={ MEDIA_LINK }
					onChange={ vi.fn() }
				/>
			);

			expect( getLinkTo() ).toHaveTextContent( expected );
		}
	);

	test( 'offers the media file and attachment page above the page suggestions', async () => {
		const user = userEvent.setup();
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				onChange={ vi.fn() }
			/>
		);

		const options = await openLinkTo( user );

		expect( options[ 0 ] ).toHaveTextContent( 'Media file' );
		expect( options[ 1 ] ).toHaveTextContent( 'Attachment page' );
		expect( options[ 2 ] ).toHaveTextContent( 'About' );
	} );

	test( 'does not offer the attachment page when the media has none', async () => {
		const user = userEvent.setup();
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				onChange={ vi.fn() }
			/>
		);

		const options = await openLinkTo( user );

		expect( options[ 0 ] ).toHaveTextContent( 'Media file' );
		expect( options[ 1 ] ).toHaveTextContent( 'About' );
	} );

	test( 'offers only the media file and attachment page without the custom destination', async () => {
		const user = userEvent.setup();
		render(
			<MediaLinkControl
				href={ MEDIA_URL }
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				destinations={ [ 'media', 'attachment' ] }
				onChange={ vi.fn() }
			/>
		);

		const options = await openLinkTo( user );

		expect( options.map( ( option ) => option.textContent ) ).toEqual( [
			expect.stringContaining( 'Media file' ),
			expect.stringContaining( 'Attachment page' ),
		] );
	} );

	test.each( [
		[ 'Media file', { href: MEDIA_URL, linkDestination: 'media' } ],
		[
			'Attachment page',
			{ href: MEDIA_LINK, linkDestination: 'attachment' },
		],
		[
			'About',
			{ href: 'https://example.com/about', linkDestination: 'custom' },
		],
	] )(
		'links to the destination when %s is chosen',
		async ( label, expected ) => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<MediaLinkControl
					linkDestination="none"
					mediaUrl={ MEDIA_URL }
					mediaLink={ MEDIA_LINK }
					onChange={ onChange }
				/>
			);

			const options = await openLinkTo( user );
			await user.click(
				options.find( ( option ) =>
					option.textContent?.includes( label )
				)!
			);

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( expected );
		}
	);

	test( 'links to a typed URL', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				onChange={ onChange }
			/>
		);

		await user.click( getLinkTo() );
		const urlInput = await screen.findByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await user.type( urlInput, 'https://wordpress.org' );
		triggerEnter( urlInput );

		expect( onChange ).toHaveBeenCalledWith( {
			href: 'https://wordpress.org',
			linkDestination: 'custom',
		} );
	} );

	test( 'links to the media file when its URL is typed', async () => {
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

		await user.click( getLinkTo() );
		const urlInput = await screen.findByRole( 'combobox', {
			name: 'Search or type URL',
		} );
		await user.type( urlInput, MEDIA_URL );
		triggerEnter( urlInput );

		expect( onChange ).toHaveBeenCalledWith( {
			href: MEDIA_URL,
			linkDestination: 'media',
		} );
	} );

	test( 'removes the link', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<MediaLinkControl
				linkDestination="media"
				href={ MEDIA_URL }
				mediaUrl={ MEDIA_URL }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Remove link' } )
		);

		expect( onChange ).toHaveBeenCalledWith( {
			href: undefined,
			linkDestination: 'none',
		} );
	} );

	test( 'does not offer to remove a link when there is none', () => {
		render(
			<MediaLinkControl
				linkDestination="none"
				mediaUrl={ MEDIA_URL }
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Remove link' } )
		).not.toBeInTheDocument();
	} );

	test( 'does not offer to remove the link without the none destination', () => {
		render(
			<MediaLinkControl
				href={ MEDIA_URL }
				mediaUrl={ MEDIA_URL }
				mediaLink={ MEDIA_LINK }
				destinations={ [ 'media', 'attachment' ] }
				onChange={ vi.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Remove link' } )
		).not.toBeInTheDocument();
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
