/**
 * WordPress dependencies
 */
import { pasteHandler } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { init as initAndRegisterTableBlock } from '../../../../../block-library/src/table';

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
			<th colspan="2">Footer Cell</th>
			<th>Footer Cell</th>
		</tr>
	</tfoot>
</table>`;

describe( 'pasteHandler', () => {
	beforeAll( () => {
		initAndRegisterTableBlock();
	} );

	it( 'can handle a table with thead, tbody and tfoot using colspan', () => {
		const [ result ] = pasteHandler( {
			HTML: tableWithHeaderFooterAndBodyUsingColspan,
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
						{ content: 'Footer Cell', tag: 'th', colspan: '2' },
						{ content: 'Footer Cell', tag: 'th' },
					],
				},
			],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );
} );
