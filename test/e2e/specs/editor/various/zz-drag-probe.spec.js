/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'drag probe (@webkit)', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'probe drag into nested block', async ( { page, editor } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '1' },
		} );
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: '2' },
				},
			],
		} );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );

		// Arm the recorder inside the canvas.
		await page.evaluate( () => {
			const f = document.querySelector( 'iframe[name="editor-canvas"]' );
			const w = f.contentWindow;
			const d = f.contentDocument;
			const log = ( w.__rec = [] );
			const t = () => Math.round( w.performance.now() );
			const desc = ( n ) =>
				n
					? n.nodeName +
					  ( n.nodeType === 3
							? '"' + n.textContent.slice( 0, 6 ) + '"'
							: '' )
					: '-';
			const stack = () =>
				new Error().stack
					.split( '\n' )
					.slice( 2, 5 )
					.map( ( l ) => l.trim().slice( 0, 90 ) )
					.join( ' | ' );
			[
				'beforeinput',
				'input',
				'keydown',
				'compositionstart',
				'mousedown',
				'mouseup',
				'focusin',
				'focusout',
			].forEach( ( type ) =>
				d.addEventListener(
					type,
					( e ) =>
						log.push(
							t() +
								' ev:' +
								type +
								( e.inputType ? '/' + e.inputType : '' ) +
								' tgt=' +
								desc( e.target ) +
								' tr=' +
								e.isTrusted
						),
					true
				)
			);
			[ 'removeAllRanges', 'addRange', 'setBaseAndExtent', 'extend', 'collapse', 'selectAllChildren' ].forEach(
				( m ) => {
					const orig = w.Selection.prototype[ m ];
					w.Selection.prototype[ m ] = function ( ...args ) {
						log.push( t() + ' sel:' + m + ' @ ' + stack() );
						return orig.apply( this, args );
					};
				}
			);
			const store = window.wp.data.select( 'core/block-editor' );
			let last = '';
			window.wp.data.subscribe( () => {
				const blocks = store
					.getBlocks()
					.map(
						( b ) =>
							( b.attributes.content ?? b.name ) +
							'(' +
							b.innerBlocks
								.map( ( i ) => i.attributes.content ?? i.name )
								.join( ',' ) +
							')'
					)
					.join( '|' );
				const sel = store
					.getSelectedBlockClientIds()
					.map( ( i ) => i.slice( 0, 4 ) )
					.join( ',' );
				const cur = blocks + ' sel=[' + sel + ']';
				if ( cur !== last ) {
					last = cur;
					log.push( t() + ' store: ' + cur );
				}
			} );
		} );

		const [ paragraph1, paragraph2 ] = await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.all();

		await paragraph1.hover();
		await page.mouse.down();
		await paragraph2.hover();
		await page.mouse.up();
		await page.waitForTimeout( 1500 );

		const rec = await page.evaluate( () => {
			const f = document.querySelector( 'iframe[name="editor-canvas"]' );
			return f.contentWindow.__rec.splice( 0 );
		} );
		// eslint-disable-next-line no-console
		console.log( 'REC-START' );
		for ( const line of rec ) {
			// eslint-disable-next-line no-console
			console.log( 'REC', line );
		}
		// eslint-disable-next-line no-console
		console.log( 'REC-END' );
		expect( true ).toBe( true );
	} );
} );
