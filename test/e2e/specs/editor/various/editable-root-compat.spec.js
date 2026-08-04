/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editable root block event handler compatibility', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'delivers keyboard events to a block wrapperProps handler', async ( {
		editor,
		page,
	} ) => {
		// A third party adds an event handler to every block through
		// wrapperProps, the surface host mode would otherwise bypass.
		await page.evaluate( () => {
			window.__extKeys = [];
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: ( event ) =>
								window.__extKeys.push( event.key ),
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );

		// Move to the first paragraph so the wrapper becomes the editing host.
		await page.keyboard.press( 'ArrowUp' );

		await page.evaluate( () => ( window.__extKeys = [] ) );
		await page.keyboard.type( 'x' );

		await expect
			.poll( () => page.evaluate( () => window.__extKeys ) )
			.toContain( 'x' );
	} );

	test( 'lets a block wrapperProps handler cancel the default action', async ( {
		editor,
		page,
	} ) => {
		await page.evaluate( () => {
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-prevent',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: ( event ) => {
								if ( event.key === 'b' ) {
									event.preventDefault();
								}
							},
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );

		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'End' );

		// 'a' types; 'b' is canceled by the handler.
		await page.keyboard.type( 'ab' );

		const [ firstParagraph ] = await editor.getBlocks();
		expect( firstParagraph.attributes.content ).toBe( 'aa' );
	} );

	test( 'passes a synthetic-like event with a working nativeEvent', async ( {
		editor,
		page,
	} ) => {
		await page.evaluate( () => {
			window.__extInput = [];
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-synthetic',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onBeforeInput: ( event ) => {
								window.__extInput.push( {
									data: event.data,
									isSynthetic:
										typeof event.persist === 'function',
									nativeEventType:
										event.nativeEvent?.constructor?.name,
									isDefaultPrevented:
										event.isDefaultPrevented(),
									// The real event is wrapped, so these
									// are faithful, not a scripted copy's.
									isTrusted: event.isTrusted,
									// Not on React's synthetic event, so
									// reached through the native event.
									hasTargetRanges:
										event.nativeEvent.getTargetRanges()
											.length > 0,
								} );
							},
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );
		await page.keyboard.press( 'ArrowUp' );
		await page.evaluate( () => ( window.__extInput = [] ) );
		await page.keyboard.type( 'x' );

		const record = await page
			.evaluate( () => window.__extInput )
			.then( ( entries ) => entries.at( -1 ) );
		expect( record ).toMatchObject( {
			data: 'x',
			isSynthetic: true,
			nativeEventType: 'InputEvent',
			isDefaultPrevented: false,
			isTrusted: true,
			hasTargetRanges: true,
		} );
	} );

	test( 'stops propagation between nested block handlers', async ( {
		editor,
		page,
	} ) => {
		// The inner (list item) handler stops propagation; the outer (list)
		// handler must not see the event, like React bubbling.
		await page.evaluate( () => {
			window.__extPath = [];
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-nested',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: ( event ) => {
								window.__extPath.push( props.block.name );
								if ( props.block.name === 'core/list-item' ) {
									event.stopPropagation();
								}
							},
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/list',
			innerBlocks: [
				{
					name: 'core/list-item',
					attributes: { content: 'item' },
				},
				{
					name: 'core/list-item',
					attributes: { content: 'item two' },
				},
			],
		} );

		// Select the first list item so the wrapper hosts.
		await editor.canvas
			.getByRole( 'textbox', { name: 'List text' } )
			.first()
			.click();
		await page.evaluate( () => ( window.__extPath = [] ) );
		await page.keyboard.type( 'x' );

		await expect
			.poll( () => page.evaluate( () => window.__extPath ) )
			.toEqual( [ 'core/list-item' ] );
	} );

	test( 'delivers input events to a block wrapperProps handler', async ( {
		editor,
		page,
	} ) => {
		await page.evaluate( () => {
			window.__extInputData = [];
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-input',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onInput: ( event ) =>
								window.__extInputData.push( event.data ),
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'a' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'b' },
		} );

		await page.keyboard.press( 'ArrowUp' );
		await page.evaluate( () => ( window.__extInputData = [] ) );
		await page.keyboard.type( 'x' );

		await expect
			.poll( () => page.evaluate( () => window.__extInputData ) )
			.toContain( 'x' );
	} );

	test( 'does not double up an event React already delivers', async ( {
		editor,
		page,
	} ) => {
		// The code block is plain text, not part of the rich-text writing flow,
		// so it will never be an editableRoot host: React delivers the event to
		// the block as usual. The host bridge must recognise the event isn't on
		// the host and stay out of the way, so the handler runs once, not twice.
		await page.evaluate( () => {
			window.__extCount = 0;
			const { createElement } = window.wp.element;
			window.wp.hooks.addFilter(
				'editor.BlockListBlock',
				'test/compat-events-count',
				( BlockListBlock ) => ( props ) =>
					createElement( BlockListBlock, {
						...props,
						wrapperProps: {
							...props.wrapperProps,
							onKeyDown: () => ( window.__extCount += 1 ),
						},
					} )
			);
		} );

		await editor.insertBlock( {
			name: 'core/code',
			attributes: { content: 'a' },
		} );

		await page.evaluate( () => ( window.__extCount = 0 ) );
		await page.keyboard.press( 'x' );

		// One keydown, one call. A second would mean the bridge fired on top of
		// React's delivery.
		await expect
			.poll( () => page.evaluate( () => window.__extCount ) )
			.toBe( 1 );
	} );
} );
