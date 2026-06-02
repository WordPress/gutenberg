/**
 * WordPress dependencies
 */
import { pasteHandler } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
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
