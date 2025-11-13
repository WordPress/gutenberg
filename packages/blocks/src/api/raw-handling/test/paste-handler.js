/**
 * WordPress dependencies
 */
import { pasteHandler, rawHandler } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { init as initAndRegisterTableBlock } from '../../../../../block-library/src/table';
import { init as initAndRegisterVideoBlock } from '../../../../../block-library/src/video';
import { init as initAndRegisterCodeBlock } from '../../../../../block-library/src/code';
import { init as initAndRegisterParagraphBlock } from '../../../../../block-library/src/paragraph';

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
		initAndRegisterCodeBlock();
		initAndRegisterParagraphBlock();
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

	it( 'should preserve content with bash ANSI-C quoting in pre/code blocks', () => {
		// Test case from the bug report - when switching from code editor to visual editor
		// the raw HTML is parsed directly by rawHandler
		const htmlFromCodeEditor = `Add the following to your <code>~/.bashrc</code> if you use bash or <code>~/.zshrc</code> if you use zsh:
<pre><code># Set colors for less. Borrowed from https://wiki.archlinux.org/index.php/Color_output_in_console#less .
export LESS_TERMCAP_mb=$'\\E[1;31m'     # begin bold
export LESS_TERMCAP_md=$'\\E[1;36m'     # begin blink
export LESS_TERMCAP_me=$'\\E[0m'        # reset bold/blink
export LESS_TERMCAP_so=$'\\E[01;44;33m' # begin reverse video
export LESS_TERMCAP_se=$'\\E[0m'        # reset reverse video
export LESS_TERMCAP_us=$'\\E[1;32m'     # begin underline
export LESS_TERMCAP_ue=$'\\E[0m'        # reset underline</code></pre>
Now restart your shell and run <code>man less</code>—the manual is in colors! The difference is shown in the following two images`;

		// Parse the raw HTML directly (simulates switching from code editor to visual editor)
		const blocks = rawHandler( {
			HTML: htmlFromCodeEditor,
		} );

		// Should create 3 blocks: paragraph, code, paragraph
		expect( blocks ).toHaveLength( 3 );
		expect( blocks[ 0 ].name ).toBe( 'core/paragraph' );
		expect( blocks[ 1 ].name ).toBe( 'core/code' );
		expect( blocks[ 2 ].name ).toBe( 'core/paragraph' );

		const codeContent = String( blocks[ 1 ].attributes.content );

		// Verify all export lines are preserved (this is what currently fails in real browsers)
		expect( codeContent ).toContain( "export LESS_TERMCAP_mb=$'" );
		expect( codeContent ).toContain( "\\E[1;31m'" );
		expect( codeContent ).toContain( '# begin bold' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_md=$'" );
		expect( codeContent ).toContain( "\\E[1;36m'" );
		expect( codeContent ).toContain( '# begin blink' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_me=$'" );
		expect( codeContent ).toContain( "\\E[0m'" );
		expect( codeContent ).toContain( '# reset bold/blink' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_so=$'" );
		expect( codeContent ).toContain( "\\E[01;44;33m'" );
		expect( codeContent ).toContain( '# begin reverse video' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_se=$'" );
		expect( codeContent ).toContain( '# reset reverse video' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_us=$'" );
		expect( codeContent ).toContain( "\\E[1;32m'" );
		expect( codeContent ).toContain( '# begin underline' );
		expect( codeContent ).toContain( "export LESS_TERMCAP_ue=$'" );
		expect( codeContent ).toContain( '# reset underline' );

		// Verify the text after the code block is in a separate paragraph
		const lastParagraphContent = String( blocks[ 2 ].attributes.content );
		expect( lastParagraphContent ).toContain( 'Now restart your shell' );
		expect( lastParagraphContent ).toContain( 'man less' );

		// Verify the "man less" text appears only once (not duplicated)
		const allContent = blocks
			.map( ( block ) => String( block.attributes.content || '' ) )
			.join( ' ' );
		const manLessMatches = allContent.match( /man less/g ) || [];
		expect( manLessMatches.length ).toBe( 1 );
	} );
} );
