/**
 * WordPress dependencies
 */
import { pasteHandler } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { init as initAndRegisterTableBlock } from '../../../../../block-library/src/table';

const tableWithHeaderFooterAndBodyUsingColspanAndRowspan = `
<table>
	<thead>
		<tr>
			<th>Header Cell</th>
			<th>Header Cell</th>
			<th rowspan="2">Rowspan 2</th>
		</tr>
		<tr>
			<th colspan="2">Colspan 2</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Body Cell</td>
			<td>Body Cell</td>
			<td rowspan="2">Rowspan 2</td>
		</tr>
		<tr>
			<td colspan="2">Colspan 2</td>
		</tr>
	</tbody>
	<tfoot>
		<tr>
			<td>Footer Cell</td>
			<td>Footer Cell</td>
			<td rowspan="2">Rowspan 2</td>
		</tr>
		<tr>
			<td colspan="2">Colspan 2</td>
		</tr>
	</tfoot>
</table>`;

const googleDocsTableWithColspanAndRowspan = `
<google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:Arial;width:0px;border-collapse:collapse;border:none"><colgroup><col width="100"/><col width="100"/><col width="100"/></colgroup><tbody><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;" data-sheets-value="{&quot;1&quot;:2,&quot;2&quot;:&quot;Body Cell&quot;}">Body Cell</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;" data-sheets-value="{&quot;1&quot;:2,&quot;2&quot;:&quot;Body Cell&quot;}">Body Cell</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;" rowspan="2" colspan="1" data-sheets-value="{&quot;1&quot;:2,&quot;2&quot;:&quot;Rowspan 2&quot;}"><span><div style="max-height:42px">Rowspan 2</div></span></td></tr><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:bottom;" rowspan="1" colspan="2" data-sheets-value="{&quot;1&quot;:2,&quot;2&quot;:&quot;Colspan 2&quot;}">Colspan 2</td></tr></tbody></table>
`;

describe( 'pasteHandler', () => {
	beforeAll( () => {
		initAndRegisterTableBlock();
	} );

	it( 'can handle a table with thead, tbody and tfoot using colspan and rowspan', () => {
		const [ result ] = pasteHandler( {
			HTML: tableWithHeaderFooterAndBodyUsingColspanAndRowspan,
			tagName: 'p',
			preserveWhiteSpace: false,
		} );

		expect( console ).toHaveLogged();

		expect( result.attributes ).toEqual( {
			hasFixedLayout: false,
			caption: '',
			head: [
				{
					cells: [
						{
							content: 'Header Cell',
							tag: 'th',
						},
						{
							content: 'Header Cell',
							tag: 'th',
						},
						{
							content: 'Rowspan 2',
							tag: 'th',
							rowspan: '2',
						},
					],
				},
				{
					cells: [
						{
							content: 'Colspan 2',
							tag: 'th',
							colspan: '2',
						},
					],
				},
			],
			body: [
				{
					cells: [
						{
							content: 'Body Cell',
							tag: 'td',
						},
						{
							content: 'Body Cell',
							tag: 'td',
						},
						{
							content: 'Rowspan 2',
							tag: 'td',
							rowspan: '2',
						},
					],
				},
				{
					cells: [
						{
							content: 'Colspan 2',
							tag: 'td',
							colspan: '2',
						},
					],
				},
			],
			foot: [
				{
					cells: [
						{
							content: 'Footer Cell',
							tag: 'td',
						},
						{
							content: 'Footer Cell',
							tag: 'td',
						},
						{
							content: 'Rowspan 2',
							tag: 'td',
							rowspan: '2',
						},
					],
				},
				{
					cells: [
						{
							content: 'Colspan 2',
							tag: 'td',
							colspan: '2',
						},
					],
				},
			],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );

	it( 'can handle a google docs table with colspan and rowspan', () => {
		const [ result ] = pasteHandler( {
			HTML: googleDocsTableWithColspanAndRowspan,
			tagName: 'p',
			preserveWhiteSpace: false,
		} );

		expect( console ).toHaveLogged();

		expect( result.attributes ).toEqual( {
			hasFixedLayout: false,
			caption: '',
			body: [
				{
					cells: [
						{
							content: 'Body Cell',
							tag: 'td',
						},
						{
							content: 'Body Cell',
							tag: 'td',
						},
						{
							content: 'Rowspan 2',
							tag: 'td',
							colspan: '1',
							rowspan: '2',
						},
					],
				},
				{
					cells: [
						{
							content: 'Colspan 2',
							tag: 'td',
							colspan: '2',
							rowspan: '1',
						},
					],
				},
			],
			head: [],
			foot: [],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );
} );
