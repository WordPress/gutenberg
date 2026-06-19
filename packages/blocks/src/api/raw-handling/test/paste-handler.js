/**
 * WordPress dependencies
 */
import { pasteHandler, serialize } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { init as initAndRegisterImageBlock } from '../../../../../block-library/src/image';
import { init as initAndRegisterTableBlock } from '../../../../../block-library/src/table';
import { init as initAndRegisterVideoBlock } from '../../../../../block-library/src/video';

const tableWithHeaderFooterAndBodyUsingColspan = `
<table>
	<thead>
		<tr>
			<th colspan="2">Colspan 2</th>
			<th>Header Cell</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td colspan="2">Colspan 2</td>
			<td>Cell Data</td>
		</tr>
	</tbody>
	<tfoot>
		<tr>
			<th colspan="2">Colspan 2</th>
			<th>Footer Cell</th>
		</tr>
	</tfoot>
</table>`;

const tableWithHeaderFooterAndBodyUsingRowspan = `
<table>
	<thead>
		<tr>
			<th rowspan="2">Rowspan 2</th>
			<th>Header Cell</th>
		</tr>
		<tr>
			<th>Header Cell</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td rowspan="2">Rowspan 2</td>
			<td>Cell Data</td>
		</tr>
		<tr>
			<td>Cell Data</td>
		</tr>
	</tbody>
	<tfoot>
		<tr>
			<td rowspan="2">Rowspan 2</td>
			<td>Footer Cell</td>
		</tr>
		<tr>
			<td>Footer Cell</td>
		</tr>
	</tfoot>
</table>`;

const tableWithCellAlignments = `
<table>
	<thead>
		<tr>
			<th style="text-align: left;">A - Left</th>
			<th style="text-align: center;">B - Centered</th>
			<th style="text-align: right;">C - Right</th>
			<th>D - None</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td style="text-align: left;">100</td>
			<td style="text-align: center;">150</td>
			<td style="text-align: right;">200</td>
			<td>250</td>
		</tr>
	</tbody>
</table>`;

describe( 'pasteHandler', () => {
	beforeAll( () => {
		initAndRegisterTableBlock();
		initAndRegisterVideoBlock();
	} );

	it( 'can handle a table with thead, tbody and tfoot using colspan', () => {
		const [ result ] = pasteHandler( {
			HTML: tableWithHeaderFooterAndBodyUsingColspan,
			tagName: 'p',
		} );

		expect( console ).toHaveLogged();

		delete result.attributes.caption;
		expect( result.attributes ).toEqual( {
			hasFixedLayout: true,
			head: [
				{
					cells: [
						{ content: 'Colspan 2', tag: 'th', colspan: '2' },
						{ content: 'Header Cell', tag: 'th' },
					],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Colspan 2', tag: 'td', colspan: '2' },
						{ content: 'Cell Data', tag: 'td' },
					],
				},
			],
			foot: [
				{
					cells: [
						{ content: 'Colspan 2', tag: 'th', colspan: '2' },
						{ content: 'Footer Cell', tag: 'th' },
					],
				},
			],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );

	it( 'can handle a table with thead, tbody and tfoot using rowspan', () => {
		const [ result ] = pasteHandler( {
			HTML: tableWithHeaderFooterAndBodyUsingRowspan,
			tagName: 'p',
		} );

		expect( console ).toHaveLogged();

		delete result.attributes.caption;
		expect( result.attributes ).toEqual( {
			hasFixedLayout: true,
			head: [
				{
					cells: [
						{ content: 'Rowspan 2', tag: 'th', rowspan: '2' },
						{ content: 'Header Cell', tag: 'th' },
					],
				},
				{
					cells: [ { content: 'Header Cell', tag: 'th' } ],
				},
			],
			body: [
				{
					cells: [
						{ content: 'Rowspan 2', tag: 'td', rowspan: '2' },
						{ content: 'Cell Data', tag: 'td' },
					],
				},
				{
					cells: [ { content: 'Cell Data', tag: 'td' } ],
				},
			],
			foot: [
				{
					cells: [
						{ content: 'Rowspan 2', tag: 'td', rowspan: '2' },
						{ content: 'Footer Cell', tag: 'td' },
					],
				},
				{
					cells: [ { content: 'Footer Cell', tag: 'td' } ],
				},
			],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );

	it( 'can handle a table with cell alignments', () => {
		const [ result ] = pasteHandler( {
			HTML: tableWithCellAlignments,
			tagName: 'p',
		} );

		expect( console ).toHaveLogged();

		delete result.attributes.caption;

		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();

		expect( result.attributes ).toEqual( {
			hasFixedLayout: true,
			head: [
				{
					cells: [
						{
							content: 'A - Left',
							tag: 'th',
							align: 'left',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: 'B - Centered',
							tag: 'th',
							align: 'center',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: 'C - Right',
							tag: 'th',
							align: 'right',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: 'D - None',
							tag: 'th',
							align: undefined,
							colspan: undefined,
							rowspan: undefined,
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: '100',
							tag: 'td',
							align: 'left',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: '150',
							tag: 'td',
							align: 'center',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: '200',
							tag: 'td',
							align: 'right',
							colspan: undefined,
							rowspan: undefined,
						},
						{
							content: '250',
							tag: 'td',
							align: undefined,
							colspan: undefined,
							rowspan: undefined,
						},
					],
				},
			],
			foot: [],
		} );
	} );

	it( 'preserves <img> wrapped in <a> when source is plain text only', () => {
		const result = pasteHandler( {
			HTML: '',
			plainText:
				'<a href="https://example.com/"><img src="https://example.com/img.png" alt="x"/></a>',
			mode: 'INLINE',
			tagName: 'p',
		} );

		expect( console ).toHaveLogged();
		expect( result ).toBe(
			'<a href="https://example.com/"><img src="https://example.com/img.png" alt="x"></a>'
		);
	} );

	it( 'preserves <img> wrapped in <a> when source is HTML', () => {
		const result = pasteHandler( {
			HTML: '<a href="https://example.com/"><img src="https://example.com/img.png" alt="x"/></a>',
			plainText: '',
			mode: 'INLINE',
			tagName: 'p',
		} );

		expect( console ).toHaveLogged();
		expect( result ).toBe(
			'<a href="https://example.com/"><img src="https://example.com/img.png" alt="x"></a>'
		);
	} );

	it( 'can handle a video', () => {
		const [ result ] = pasteHandler( {
			HTML: '<video controls src="https://example.com/media.mp4" autoplay loop muted controls playsinline preload="auto" poster="https://example.com/media.jpg"></video>',
			tagName: 'p',
			preserveWhiteSpace: false,
		} );

		expect( console ).toHaveLogged();

		delete result.attributes.caption;
		expect( result.attributes ).toEqual( {
			autoplay: true,
			loop: true,
			muted: true,
			controls: true,
			playsInline: true,
			preload: 'auto',
			poster: 'https://example.com/media.jpg',
			src: 'https://example.com/media.mp4',
			tracks: [],
		} );
		expect( result.name ).toEqual( 'core/video' );
		expect( result.isValid ).toBeTruthy();
	} );
} );

describe( 'pasteHandler — core/image', () => {
	beforeAll( () => {
		initAndRegisterImageBlock();
	} );

	it( 'pins the width and lets the height follow the aspect ratio for a bare <img>', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" width="77" height="77" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.url ).toBe( 'https://example.com/i.jpg' );
		expect( result.attributes.width ).toBe( '77px' );
		// Height is pinned to `auto` rather than the literal pixel value so the
		// image scales proportionally when the content width constrains it.
		expect( result.attributes.height ).toBe( 'auto' );
		expect( result.attributes.aspectRatio ).toBe( '1' );
		// The serialized style must keep `height:auto` plus the declared
		// aspect ratio so a capped width never stretches the image.
		const serialized = serialize( result );
		expect( serialized ).toContain( 'width:77px' );
		expect( serialized ).toContain( 'height:auto' );
		expect( serialized ).toContain( 'aspect-ratio:1' );
	} );

	it( 'pins the width and lets the height follow the aspect ratio for an <img> inside a <figure>', () => {
		const [ result ] = pasteHandler( {
			HTML: '<figure><img src="https://example.com/i.jpg" width="120" height="80" /></figure>',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.width ).toBe( '120px' );
		expect( result.attributes.height ).toBe( 'auto' );
		expect( result.attributes.aspectRatio ).toBe( '1.5' );
	} );

	it( 'pins the width, sets the aspect ratio, and lifts the anchor for an anchor-wrapped <img> (e.g. a Flickr embed)', () => {
		const [ result ] = pasteHandler( {
			HTML: '<a data-flickr-embed="true" href="https://www.flickr.com/photos/x/123/"><img src="https://live.staticflickr.com/65535/123_b.jpg" width="1024" height="683" alt="pexels" /></a>',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.url ).toBe(
			'https://live.staticflickr.com/65535/123_b.jpg'
		);
		expect( result.attributes.width ).toBe( '1024px' );
		expect( result.attributes.height ).toBe( 'auto' );
		expect( result.attributes.aspectRatio ).toBe( String( 1024 / 683 ) );
		expect( result.attributes.linkDestination ).toBe( 'custom' );
		expect( result.attributes.href ).toBe(
			'https://www.flickr.com/photos/x/123/'
		);
		const serialized = serialize( result );
		expect( serialized ).toContain( 'width:1024px' );
		expect( serialized ).toContain( 'height:auto' );
		expect( serialized ).toContain( `aspect-ratio:${ 1024 / 683 }` );
	} );

	it( 'pins the width and lets the height follow when only a width is present', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" width="120" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.width ).toBe( '120px' );
		expect( result.attributes.height ).toBe( 'auto' );
		// A single declared dimension can't carry an aspect ratio.
		expect( result.attributes.aspectRatio ).toBeUndefined();
	} );

	it( 'pins the height and lets the width follow when only a height is present', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" height="80" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		// A height-only source keeps its height; the width follows via `auto`.
		expect( result.attributes.width ).toBe( 'auto' );
		expect( result.attributes.height ).toBe( '80px' );
		expect( result.attributes.aspectRatio ).toBeUndefined();
	} );

	it( 'omits the aspect ratio when a dimension is zero', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" width="100" height="0" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		// A zero dimension would divide to `Infinity`/`NaN`, so no ratio is set.
		expect( result.attributes.aspectRatio ).toBeUndefined();
	} );

	it( 'drops non-pixel width/height (e.g. percentages)', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" width="50%" height="auto" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.width ).toBeUndefined();
		expect( result.attributes.height ).toBeUndefined();
	} );

	it( 'leaves width/height unset when not present on the source', () => {
		const [ result ] = pasteHandler( {
			HTML: '<img src="https://example.com/i.jpg" />',
			mode: 'BLOCKS',
		} );

		expect( console ).toHaveLogged();

		expect( result.name ).toBe( 'core/image' );
		expect( result.attributes.width ).toBeUndefined();
		expect( result.attributes.height ).toBeUndefined();
	} );
} );
