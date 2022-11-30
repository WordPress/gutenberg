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
    <tfoot>
    <tr>
        <th colspan="2">Footer Cell</th>
        <th>Footer Cell</th>
    </tr>
    </tfoot>
    <tbody>
    <tr>
        <td colspan="2">Colspan 2</td>
        <td>Cell Data</td>
    </tr>
    </tbody>
</table>`;

const googleDocsTableWithColspan = `
<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-b0f68bdd-7fff-a054-94d1-43c2fdedca2a">
    <div dir="ltr" style="margin-left:0pt;" align="left">
        <table style="border:none;border-collapse:collapse;">
            <colgroup>
                <col width="185"/>
                <col width="439"/>
            </colgroup>
            <tbody>
            <tr style="height:21pt">
                <td colspan="2"
                    style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;overflow:hidden;overflow-wrap:break-word;">
                    <p dir="ltr" style="line-height:1.2;margin-top:0pt;margin-bottom:0pt;"><span
                            style="font-size:11pt;font-family:Arial;color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Test colspan</span>
                    </p></td>
            </tr>
            </tbody>
        </table>
    </div>
    <br/><br/></b>
`;

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

	it( 'can handle a google docs table with colspan', () => {
		const [ result ] = pasteHandler( {
			HTML: googleDocsTableWithColspan,
			tagName: 'p',
			preserveWhiteSpace: false,
		} );

		expect( console ).toHaveLogged();

		expect( result.attributes ).toEqual( {
			body: [
				{
					cells: [
						{
							align: undefined,
							colspan: '2',
							content: 'Test colspan',
							scope: undefined,
							tag: 'td',
						},
					],
				},
			],
			caption: '',
			foot: [],
			hasFixedLayout: false,
			head: [],
		} );
		expect( result.name ).toEqual( 'core/table' );
		expect( result.isValid ).toBeTruthy();
	} );
} );
