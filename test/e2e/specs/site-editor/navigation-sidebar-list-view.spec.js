const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Navigation sidebar - list view editing', () => {
	const navMenuFixture = {
		title: 'Test Navigation Menu',
		content:
			'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->',
	};

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createPage( {
			title: 'Test Page 1',
			status: 'publish',
		} );
		await requestUtils.createPage( {
			title: 'Test Page 2',
			status: 'publish',
		} );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.use( {
		linkControl: async ( { page }, use ) => {
			await use( new LinkControl( { page } ) );
		},
	} );

	test( 'can use appender in site editor sidebar list view', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		// Visit the site editor in sidebar-browse mode (without canvas: 'edit')
		// so that the sidebar shows the navigation menu's list view.
		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect( listView ).toBeVisible();

		// Verify the existing item is shown in the sidebar list view.
		await expect(
			listView.getByRole( 'link', { name: 'Existing Item' } )
		).toBeVisible();

		// The appender button should be present to allow adding new items.
		const appender = listView.getByRole( 'button', {
			name: 'Add page',
		} );
		await expect( appender ).toBeVisible();

		const linkControlSearch = linkControl.getLinkControlSearch();

		await test.step( 'can add new menu items', async () => {
			await appender.click();

			// The LinkUI popover should open and immediately focus the search input.
			await expect( linkControlSearch ).toBeFocused();

			// Search for and select the page.
			await linkControl.useLinkControlSearch( 'Test Page 2' );

			// The new item should be appended after the existing item.
			await expect(
				listView.getByRole( 'link', { name: 'Test Page 2' } )
			).toBeVisible();
		} );

		await test.step( 'can open and close the Link UI without losing focus', async () => {
			await page.keyboard.press( 'ArrowDown' );
			await expect( appender ).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect( linkControlSearch ).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect( linkControlSearch ).toBeHidden();
		} );

		await test.step( 'can create a new page', async () => {
			await appender.click();

			// The search input should be focused immediately.
			await expect( linkControl.getLinkControlSearch() ).toBeFocused();

			// Type a new page title that doesn't exist yet.
			await page.keyboard.type( 'Brand New Page', { delay: 50 } );

			// Tab twice to reach the "Create page" button.
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );

			const createPageButton = page.getByRole( 'button', {
				name: 'Create page',
			} );
			await expect( createPageButton ).toBeVisible();
			await expect( createPageButton ).toBeFocused();

			// Open the page creation form.
			await page.keyboard.press( 'Enter' );

			// The title field should be pre-populated with the typed text.
			const titleField = page.getByRole( 'textbox', { name: 'Title' } );
			await expect( titleField ).toHaveValue( 'Brand New Page' );

			// The Back button should be focused after entering the creation form.
			const backButton = page.locator( '.link-ui-page-creator__back' );
			await expect( backButton ).toBeFocused();

			// Tab to the title field.
			await page.keyboard.press( 'Tab' );
			await expect( titleField ).toBeFocused();

			// Tab to the Publish checkbox (on by default).
			await page.keyboard.press( 'Tab' );
			const publishCheckbox = page.getByRole( 'checkbox', {
				name: 'Publish',
			} );
			await expect( publishCheckbox ).toBeFocused();
			await expect( publishCheckbox ).toBeChecked();

			// Tab twice more to reach the Create page button.
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Tab' );
			await expect( createPageButton ).toBeFocused();
			await page.keyboard.press( 'Enter' );

			// The newly created page should appear as a new item in the list view.
			await expect(
				listView.getByRole( 'link', { name: 'Brand New Page' } )
			).toBeVisible();
		} );
	} );

	test( 'does not select blocks in the canvas preview when editing from the sidebar', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu =
			await requestUtils.createNavigationMenu( navMenuFixture );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const canvas = page.frameLocator( 'iframe[name="editor-canvas"]' );
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );

		await expect( canvas.getByText( 'Existing Item' ) ).toBeVisible();

		// Select an item, then add a new one from the appender. The edit is
		// what carries the sidebar's selection over to the entity.
		await listView.getByRole( 'link', { name: 'Existing Item' } ).click();
		// The click opens the item's settings a moment later, and they move
		// focus after they open. Wait for that focus, so the settings can't
		// take focus from the appender.
		await expect(
			page.getByRole( 'button', { name: 'Settings options' } )
		).toBeFocused();
		await listView.getByRole( 'button', { name: 'Add page' } ).click();
		await linkControl.useLinkControlSearch( 'Test Page 2' );
		await expect(
			listView.getByRole( 'link', { name: 'Test Page 2' } )
		).toBeVisible();

		// The preview picks up the change without adopting the selection.
		await expect( canvas.getByText( 'Test Page 2' ) ).toBeVisible();
		await expect( blockToolbar ).toBeHidden();
		expect(
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			)
		).toBeNull();
	} );

	test( 'can edit links from the settings popover', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Test Navigation Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"http://www.wordpress.org/","kind":"custom"} /-->' +
				'<!-- wp:navigation-submenu {"label":"Submenu Item","type":"custom","url":"http://www.wordpress.org/submenu/","kind":"custom"} -->' +
				'<!-- wp:navigation-link {"label":"Child Item","type":"custom","url":"http://www.wordpress.org/child/","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->' +
				'<!-- wp:navigation-link {"label":"No URL"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const labelInput = page.getByRole( 'textbox', { name: 'Text' } );

		await test.step( 'opens when selecting a link', async () => {
			await listView
				.getByRole( 'link', { name: 'Existing Item' } )
				.click();

			await expect(
				page.getByRole( 'heading', { name: 'Settings' } )
			).toBeVisible();
			await expect( labelInput ).toHaveValue( 'Existing Item' );
			await expect(
				page.getByRole( 'checkbox', { name: 'Open in new tab' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'link', { name: 'View' } )
			).toBeVisible();
			// Matches the content-only popover: less common fields are
			// available from the panel menu rather than shown by default.
			await expect(
				page.getByRole( 'textbox', { name: 'Description' } )
			).toBeHidden();
			await expect(
				page.getByRole( 'textbox', { name: 'Rel attribute' } )
			).toBeHidden();
		} );

		await test.step( 'edits the link label', async () => {
			await labelInput.fill( 'Changed Label' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Label' } )
			).toBeVisible();
			await expect(
				listView.getByRole( 'link', { name: 'Existing Item' } )
			).toBeHidden();
		} );

		await test.step( 'closes with Escape and returns focus to the item', async () => {
			await labelInput.focus();
			await page.keyboard.press( 'Escape' );

			await expect( labelInput ).toBeHidden();
			await expect(
				listView.getByRole( 'link', { name: 'Changed Label' } )
			).toBeFocused();
		} );

		await test.step( 'opens with Enter from the keyboard', async () => {
			// Focus is on the edited item's row after Escape.
			await page.keyboard.press( 'ArrowDown' );
			await expect(
				listView.getByRole( 'link', { name: 'Submenu Item' } )
			).toBeFocused();
			await page.keyboard.press( 'Enter' );

			await expect( labelInput ).toHaveValue( 'Submenu Item' );
		} );

		await test.step( 'edits a submenu label', async () => {
			await labelInput.fill( 'Changed Submenu' );

			await expect(
				listView.getByRole( 'link', { name: 'Changed Submenu' } )
			).toBeVisible();
		} );

		await test.step( 'switches to another item while the popover is open', async () => {
			// Hold the click as a person does. The popover's focus-outside check
			// runs between mouse down and up, before the row's click opens the
			// popover for the new item. An instant click would run it afterward.
			await listView
				.getByRole( 'link', { name: 'No URL' } )
				.click( { delay: 100 } );

			await expect( labelInput ).toHaveValue( 'No URL' );
		} );

		await test.step( 'adds a link to an item that has no URL', async () => {
			// The item is kept; the popover offers to add its link.
			await expect(
				listView.getByRole( 'link', { name: 'No URL' } )
			).toBeVisible();
			const linkPicker = page.getByRole( 'button', {
				name: /^Link to/,
			} );
			await expect( linkPicker ).toHaveText( /Add link/ );
			await linkPicker.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );

			// The item keeps its label and gains the link.
			await expect( linkPicker ).toHaveText( /Test Page 1/ );
			await expect(
				listView.getByRole( 'link', { name: 'No URL' } )
			).toBeVisible();
		} );
	} );

	test( 'shows the appender for an empty menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Empty Navigation Menu',
			content: '',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect(
			page.getByText( 'This Navigation Menu is empty.' )
		).toBeVisible();
		await expect(
			listView.getByRole( 'button', { name: 'Add page' } )
		).toBeVisible();
	} );

	test( 'can add the first item to an empty menu', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Empty Navigation Menu',
			content: '',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await listView.getByRole( 'button', { name: 'Add page' } ).click();
		await linkControl.useLinkControlSearch( 'Test Page 1' );

		await expect(
			listView.getByRole( 'link', { name: 'Test Page 1' } )
		).toBeVisible();
		await expect(
			page.getByText( 'This Navigation Menu is empty.' )
		).toBeHidden();
	} );

	test( 'lists the pages of a Page List block', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Page List Menu',
			content: '<!-- wp:page-list /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );

		await expect(
			listView.getByRole( 'row', { name: 'Test Page 1' } )
		).toBeVisible();
		await expect(
			listView.getByRole( 'row', { name: 'Test Page 2' } )
		).toBeVisible();
	} );

	test.describe( 'nested appender', () => {
		const nestedMenuFixture = {
			title: 'Nested Menu',
			content: `<!-- wp:navigation-submenu {"label":"Top Level Item 1","type":"custom","url":"https://wordpress.org/1","kind":"custom"} -->
<!-- wp:navigation-link {"label":"Submenu Item","type":"custom","url":"https://wordpress.org/sub","kind":"custom"} /-->
<!-- wp:navigation-submenu {"label":"Nested Submenu","type":"custom","url":"https://wordpress.org/nested","kind":"custom"} -->
<!-- wp:navigation-link {"label":"Nested Item","type":"custom","url":"https://wordpress.org/nested-item","kind":"custom"} /-->
<!-- /wp:navigation-submenu -->
<!-- /wp:navigation-submenu -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
		};

		const openSidebarListView = async (
			{ admin, page, requestUtils },
			fixture,
			visibleItem = 'Top Level Item 2'
		) => {
			const menu = await requestUtils.createNavigationMenu( fixture );
			await admin.visitSiteEditor( {
				postId: menu?.id,
				postType: 'wp_navigation',
			} );
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );
			await expect(
				listView.getByRole( 'gridcell', {
					name: visibleItem,
					exact: true,
				} )
			).toBeVisible();
			return listView;
		};

		// The nesting levels of the appender rows, top to bottom. The
		// top-level appender is always present, so `[ 1 ]` means no nested
		// appender is shown.
		const appenderLevels = ( listView ) =>
			listView
				.getByRole( 'row' )
				.filter( {
					has: listView
						.page()
						.getByRole( 'button', { name: /^Add / } ),
				} )
				.evaluateAll( ( rows ) =>
					rows.map( ( row ) =>
						Number( row.getAttribute( 'aria-level' ) )
					)
				);

		test( 'shows no appender inside a Page List, whose items cannot be edited', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const parentPage = await requestUtils.createPage( {
				title: 'Parent Page',
				status: 'publish',
			} );
			const childPage = await requestUtils.createPage( {
				title: 'Child Page',
				status: 'publish',
				parent: parentPage.id,
			} );

			// The Page List shows the site's pages and saves nothing added to
			// it, so only the menu's own appender is offered. A menu that is
			// only a Page List lists the pages at the top level, and offers
			// no appender at all.
			for ( const [ content, levels ] of [
				[
					'<!-- wp:page-list /-->' +
						'<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->',
					[ 1 ],
				],
				[ '<!-- wp:page-list /-->', [] ],
			] ) {
				const listView = await openSidebarListView(
					{ admin, page, requestUtils },
					{ title: 'Page List Menu', content },
					'Child Page'
				);
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( levels );
			}

			await Promise.all(
				[ childPage, parentPage ].map( ( { id } ) =>
					requestUtils.rest( {
						method: 'DELETE',
						path: `/wp/v2/pages/${ id }`,
						params: { force: true },
					} )
				)
			);
		} );

		test( 'shows an appender for every expanded submenu', async ( {
			admin,
			page,
			requestUtils,
			linkControl,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);
			const item = ( name ) =>
				listView.getByRole( 'gridcell', { name, exact: true } );

			// The sidebar expands every submenu, so each one has its appender
			// from the start, deepest first.
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 3, 2, 1 ] );

			await test.step( 'selection does not change them', async () => {
				await item( 'Top Level Item 2' ).click();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 3, 2, 1 ] );

				// Close the Settings popover the click opened, so it cannot
				// take focus from the rows in the next step.
				await page.getByRole( 'textbox', { name: 'Text' } ).focus();
				await page.keyboard.press( 'Escape' );
				await expect(
					page.getByRole( 'heading', { name: 'Settings' } )
				).toBeHidden();
			} );

			await test.step( 'a collapsed submenu hides its appender', async () => {
				// Focus the row without clicking it, since a click opens the
				// Settings popover, which takes focus from the row. The arrow
				// keys then collapse and expand the focused row.
				await item( 'Nested Submenu' ).getByRole( 'link' ).focus();
				await page.keyboard.press( 'ArrowLeft' );
				await expect( item( 'Nested Item' ) ).toBeHidden();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 2, 1 ] );

				await item( 'Top Level Item 1' ).getByRole( 'link' ).focus();
				await page.keyboard.press( 'ArrowLeft' );
				await expect( item( 'Submenu Item' ) ).toBeHidden();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 1 ] );

				await page.keyboard.press( 'ArrowRight' );
				await expect( item( 'Submenu Item' ) ).toBeVisible();
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 2, 1 ] );
			} );

			await test.step( 'a submenu appender is a plain + that turns blue on hover, the menu appender is a filled +', async () => {
				const transparent = 'rgba(0, 0, 0, 0)';
				// The submenu's appender is named "Add page", like the menu's,
				// but shows only its icon, with no fill.
				const submenuAppender = listView
					.getByRole( 'row', { level: 2 } )
					.getByRole( 'button', { name: 'Add page' } );
				await expect( submenuAppender ).toHaveCount( 1 );
				await expect( submenuAppender ).toHaveText( '' );
				await expect( submenuAppender ).toHaveCSS(
					'background-color',
					transparent
				);
				// On hover the + turns blue, still with no fill.
				await submenuAppender.hover();
				await expect( submenuAppender ).toHaveCSS(
					'background-color',
					transparent
				);
				await expect
					.poll( async () => {
						const [ red, green, blue ] = (
							await submenuAppender.evaluate(
								( element ) =>
									element.ownerDocument.defaultView.getComputedStyle(
										element
									).color
							)
						)
							.match( /\d+/g )
							.map( Number );
						return blue > red + 50 && blue > green;
					} )
					.toBe( true );

				// The menu's own appender, the last one, is the filled + it is
				// on trunk, showing only its icon.
				const menuAppender = listView
					.getByRole( 'button', { name: 'Add page' } )
					.last();
				await expect( menuAppender ).toHaveText( '' );
				await expect( menuAppender ).not.toHaveCSS(
					'background-color',
					transparent
				);
			} );

			await test.step( 'the submenu appender adds a link inside the submenu', async () => {
				// The nested appender row comes before the top-level one.
				await listView
					.getByRole( 'button', { name: 'Add page' } )
					.first()
					.click();

				// The Link UI opens for the new item, as it does at the top level.
				await linkControl.useLinkControlSearch( 'Test Page 1' );

				await expect(
					item( 'Test Page 1' ).filter( {
						hasText: 'Block 3 of 3, Level 2.',
					} )
				).toBeVisible();
			} );
		} );

		test( 'draws a line beside each appender up to the block it adds to', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);

			// For each appender, top to bottom: the row its line starts
			// under and the space between them, then how far the line and the
			// + are from the column of that row's icon, and from the bottom
			// of the + to the end of the line. The top-level line starts at
			// the top of the list instead, in the column of the top-level
			// chevrons.
			const lines = () =>
				listView.evaluate( ( tree ) => {
					const { getComputedStyle } = tree.ownerDocument.defaultView;
					const centerOf = ( element ) => {
						const { left, width } = element.getBoundingClientRect();
						return left + width / 2;
					};
					const blockRows = [
						...tree.querySelectorAll( '[role="row"][data-block]' ),
					];
					const appenderRows = [
						...tree.querySelectorAll(
							'.block-editor-list-view-appender-row'
						),
					];
					return appenderRows.map( ( row ) => {
						const level = row.getAttribute( 'aria-level' );
						const toggle = row.querySelector(
							'.block-editor-inserter__toggle'
						);
						const toggleRect = toggle.getBoundingClientRect();
						const line = getComputedStyle( toggle, '::before' );
						const left = toggleRect.left + parseFloat( line.left );
						const bottom =
							toggleRect.bottom - parseFloat( line.bottom );
						const top = bottom - parseFloat( line.height );
						// A short line turns from the line to the + at its
						// middle, and the line ends there.
						const joint = getComputedStyle( toggle, '::after' );
						const jointTop =
							toggleRect.top + parseFloat( joint.top );
						const jointMiddle =
							jointTop + parseFloat( joint.height ) / 2;
						const lineEnd = Math.round(
							bottom - ( jointTop + parseFloat( joint.height ) )
						);
						const joins =
							Math.round(
								toggleRect.left +
									parseFloat( joint.left ) -
									left
							) === 0 &&
							Math.round(
								toggleRect.right -
									parseFloat( joint.right ) -
									toggleRect.left
							) === 0 &&
							Math.abs(
								jointMiddle -
									( toggleRect.top + toggleRect.height / 2 )
							) <= 1;
						const fromRow = blockRows.find(
							( blockRow ) =>
								Math.abs(
									blockRow.getBoundingClientRect().bottom -
										top
								) < 1
						);
						if ( ! fromRow ) {
							const column = centerOf(
								tree.querySelector(
									'[aria-level="1"] .block-editor-list-view__expander svg'
								)
							);
							return {
								level,
								startsAtListTop:
									Math.round(
										top -
											blockRows[ 0 ].getBoundingClientRect()
												.top
									) === 0,
								line: Math.round( left - column ),
								plus: Math.round( centerOf( toggle ) - column ),
								lineEnd,
								joins,
								color: line.backgroundColor,
							};
						}
						const icon = fromRow.querySelector(
							'.block-editor-block-icon'
						);
						const column = centerOf( icon );
						return {
							level,
							from: fromRow
								.querySelector(
									'.block-editor-list-view-block-select-button__title'
								)
								.textContent.trim(),
							spaceAbove: Math.round(
								top - icon.getBoundingClientRect().bottom
							),
							line: Math.round( left - column ),
							plus: Math.round( centerOf( toggle ) - column ),
							lineEnd,
							joins,
							color: line.backgroundColor,
						};
					} );
				} );

			// Each + sits where the item it adds will show its icon, one
			// column right of the line, which turns to reach it.
			const before = await lines();
			expect( before.map( ( { color, ...line } ) => line ) ).toEqual( [
				{
					level: '3',
					from: 'Nested Submenu',
					spaceAbove: 4,
					line: 0,
					plus: 24,
					lineEnd: 0,
					joins: true,
				},
				{
					level: '2',
					from: 'Top Level Item 1',
					spaceAbove: 4,
					line: 0,
					plus: 24,
					lineEnd: 0,
					joins: true,
				},
				{
					level: '1',
					startsAtListTop: true,
					line: 0,
					plus: 24,
					lineEnd: 0,
					joins: true,
				},
			] );

			// Hovering a + leaves the color of its line as it was.
			await listView
				.getByRole( 'row', { level: 2 } )
				.getByRole( 'button', { name: 'Add page' } )
				.hover();
			expect( ( await lines() )[ 1 ].color ).toBe( before[ 1 ].color );

			// A line passes behind the chevrons of the submenus it crosses,
			// which have the background of the list, so the line looks cut.
			const chevronBackgrounds = await listView.evaluate( ( tree ) => {
				const { getComputedStyle } = tree.ownerDocument.defaultView;
				let listBackground;
				for (
					let element = tree;
					element && ! listBackground;
					element = element.parentElement
				) {
					const { backgroundColor } = getComputedStyle( element );
					if ( backgroundColor !== 'rgba(0, 0, 0, 0)' ) {
						listBackground = backgroundColor;
					}
				}
				return [
					...tree.querySelectorAll(
						'[data-expanded] .block-editor-list-view__expander svg'
					),
				].map(
					( chevron ) =>
						getComputedStyle( chevron ).backgroundColor ===
						listBackground
				);
			} );
			expect( chevronBackgrounds ).toEqual( [ true, true ] );
		} );

		test( 'adds a button from the appender of a Buttons block in the menu', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Buttons Menu',
					content: `<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">First</a></div><!-- /wp:button --></div><!-- /wp:buttons -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
				}
			);

			// The Buttons block is expanded, so its appender is there without
			// selecting anything. It is a plain +, named for what it adds.
			const appender = listView.getByRole( 'button', {
				name: 'Add Button',
			} );
			await expect( appender ).toHaveText( '' );
			await appender.click();

			// The new Button follows the first one inside the Buttons block.
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Button', exact: true } )
					.filter( {
						hasText: 'Block 2 of 2, Level 2.',
					} )
			).toBeVisible();
		} );

		test( 'adds the first icon to an empty Social Icons block', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Empty Social Icons Menu',
					content: `<!-- wp:social-links --><ul class="wp-block-social-links"></ul><!-- /wp:social-links -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
				}
			);

			// The empty Social Icons block gets an appender one level in. The
			// link could hold a submenu, but shows no appender of its own on
			// the canvas, so it gets none either.
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 2, 1 ] );

			const appender = listView
				.getByRole( 'row', { level: 2 } )
				.getByRole( 'button', { name: /^Add / } );
			await appender.focus();
			await page.keyboard.press( 'Enter' );
			await page.getByRole( 'option', { name: 'WordPress' } ).click();

			await expect(
				listView
					.getByRole( 'gridcell', { name: 'WordPress', exact: true } )
					.filter( {
						hasText: 'Block 1 of 1, Level 2.',
					} )
			).toBeVisible();
			// The appender stays where it was, now below the new icon, and
			// keeps focus for the next one.
			await expect( appender ).toBeFocused();
		} );

		test( 'adds the first link to an empty submenu that is not selected', async ( {
			admin,
			page,
			requestUtils,
			linkControl,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Empty Submenu Menu',
					content: `<!-- wp:navigation-submenu {"label":"Empty Submenu","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
				}
			);

			// The empty submenu gets an appender one level in, though its
			// canvas shows none until it is selected.
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 2, 1 ] );

			await listView
				.getByRole( 'row', { level: 2 } )
				.getByRole( 'button', { name: /^Add / } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );

			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 1' } )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );

		test( 'moves from a nested appender to its parent with the Left arrow key', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);

			await listView
				.getByRole( 'row', { level: 3 } )
				.getByRole( 'button', { name: /^Add / } )
				.focus();
			await page.keyboard.press( 'ArrowLeft' );
			await expect(
				listView
					.getByRole( 'gridcell', {
						name: 'Nested Submenu',
						exact: true,
					} )
					.getByRole( 'link' )
			).toBeFocused();
		} );

		test( 'shows no appender in an empty Social Icons block locked against editing', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Locked Social Icons Menu',
					content: `<!-- wp:social-links {"lock":{"edit":true}} --><ul class="wp-block-social-links"></ul><!-- /wp:social-links -->
<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->`,
				}
			);

			// The List View hides the inner blocks of a block locked against
			// editing, so an icon added to it could not be shown.
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 1 ] );
		} );

		test( 'extends the selection past an appender with Shift and the arrow keys', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			// Between "Nested Item" and "Top Level Item 2" are the appenders
			// of the nested submenu and of its parent. They hold no block, so
			// moving onto them keeps only the block the selection started
			// from, also when going back. A selection across levels then takes
			// in the top-level blocks on both ends.
			for ( const [ from, key, backKey ] of [
				[ 'Nested Item', 'Shift+ArrowDown', 'Shift+ArrowUp' ],
				[ 'Top Level Item 2', 'Shift+ArrowUp', 'Shift+ArrowDown' ],
			] ) {
				const listView = await openSidebarListView(
					{ admin, page, requestUtils },
					nestedMenuFixture
				);
				const selectedItems = () =>
					listView
						.locator(
							'.block-editor-list-view-block__contents-cell[aria-selected="true"]'
						)
						.evaluateAll( ( cells ) =>
							cells.map(
								( cell ) => cell.innerText.split( '\n' )[ 0 ]
							)
						);
				await expect
					.poll( () => appenderLevels( listView ) )
					.toEqual( [ 3, 2, 1 ] );

				// Focus the row without clicking it, since a click opens the
				// Settings popover, which takes focus from the row.
				await listView
					.getByRole( 'gridcell', { name: from, exact: true } )
					.getByRole( 'link' )
					.focus();

				await page.keyboard.press( key );
				await expect.poll( selectedItems ).toEqual( [ from ] );
				await page.keyboard.press( backKey );
				await expect.poll( selectedItems ).toEqual( [ from ] );

				await page.keyboard.press( key );
				await expect.poll( selectedItems ).toEqual( [ from ] );
				await page.keyboard.press( key );
				await expect.poll( selectedItems ).toEqual( [ from ] );
				await page.keyboard.press( key );
				await expect
					.poll( selectedItems )
					.toEqual( [ 'Top Level Item 1', 'Top Level Item 2' ] );
			}
		} );

		test( 'starts a new selection from an appender away from the selected block', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);
			const selectedItems = () =>
				listView
					.locator(
						'.block-editor-list-view-block__contents-cell[aria-selected="true"]'
					)
					.evaluateAll( ( cells ) =>
						cells.map(
							( cell ) => cell.innerText.split( '\n' )[ 0 ]
						)
					);
			const link = ( name ) =>
				listView
					.getByRole( 'gridcell', { name, exact: true } )
					.getByRole( 'link' );

			// Focus the rows without clicking them, since a click opens the
			// Settings popover, which takes focus from the row. End moves to
			// the menu's appender, so Shift+ArrowUp from there starts from
			// the last item.
			await link( 'Top Level Item 1' ).focus();
			await page.keyboard.press( 'End' );
			await page.keyboard.press( 'Shift+ArrowUp' );
			await expect
				.poll( selectedItems )
				.toEqual( [ 'Top Level Item 2' ] );

			// Moving onto the nested submenu's appender and back with Shift
			// starts from "Nested Item", as it would from its own row.
			await link( 'Nested Item' ).focus();
			await page.keyboard.press( 'ArrowDown' );
			await page.keyboard.press( 'Shift+ArrowUp' );
			await expect.poll( selectedItems ).toEqual( [ 'Nested Item' ] );
		} );

		test( 'renders every row in view while scrolling a long menu', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			// Each submenu adds an appender row, so a long menu has many rows
			// that are not blocks.
			const submenus = Array.from(
				{ length: 70 },
				( _, index ) =>
					`<!-- wp:navigation-submenu {"label":"Submenu ${
						index + 1
					}","type":"custom","url":"https://wordpress.org/${
						index + 1
					}","kind":"custom"} --><!-- wp:navigation-link {"label":"Item ${
						index + 1
					}","type":"custom","url":"https://wordpress.org/${
						index + 1
					}/item","kind":"custom"} /--><!-- /wp:navigation-submenu -->`
			).join( '' );
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				{
					title: 'Long Menu',
					content:
						submenus +
						'<!-- wp:navigation-link {"label":"Top Level Item 2","type":"custom","url":"https://wordpress.org/2","kind":"custom"} /-->',
				}
			);

			// Scrolls the list a screen at a time, and returns, for each
			// stop, how many pixels in view are covered by placeholders
			// instead of rows.
			const blankHeights = () =>
				listView.evaluate( async ( grid ) => {
					let scroller = grid.parentElement;
					while (
						scroller &&
						! (
							/auto|scroll/.test(
								scroller.ownerDocument.defaultView.getComputedStyle(
									scroller
								).overflowY
							) && scroller.scrollHeight > scroller.clientHeight
						)
					) {
						scroller = scroller.parentElement;
					}
					const { defaultView } = grid.ownerDocument;
					const nextFrame = () =>
						new Promise( ( resolve ) =>
							defaultView.requestAnimationFrame( () =>
								defaultView.requestAnimationFrame( resolve )
							)
						);
					const maxTop =
						scroller.scrollHeight - scroller.clientHeight;
					const heights = [];
					for ( let top = 0; ; top += scroller.clientHeight ) {
						scroller.scrollTop = Math.min( top, maxTop );
						await nextFrame();
						const view = scroller.getBoundingClientRect();
						let blank = 0;
						for ( const cell of grid.querySelectorAll(
							'.block-editor-list-view-placeholder'
						) ) {
							const rect = cell.getBoundingClientRect();
							blank += Math.max(
								0,
								Math.min( rect.bottom, view.bottom ) -
									Math.max( rect.top, view.top )
							);
						}
						heights.push( Math.round( blank ) );
						if ( top >= maxTop ) {
							return heights;
						}
					}
				} );

			await expect
				.poll( async () => Math.max( ...( await blankHeights() ) ) )
				.toBe( 0 );
		} );

		test( 'turns a link into a submenu from its Options menu', async ( {
			admin,
			page,
			requestUtils,
			linkControl,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);
			const linkRow = listView.getByRole( 'row' ).filter( {
				has: page.getByRole( 'link', {
					name: 'Top Level Item 2',
					exact: true,
				} ),
			} );

			await linkRow.getByRole( 'gridcell' ).first().hover();
			await linkRow.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );

			// The link is now a submenu holding the new page link.
			await expect(
				listView
					.getByRole( 'gridcell', {
						name: 'Test Page 1',
						exact: true,
					} )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );

		test( 'turns the new submenu back into a link when no page is picked', async ( {
			admin,
			page,
			requestUtils,
		} ) => {
			const listView = await openSidebarListView(
				{ admin, page, requestUtils },
				nestedMenuFixture
			);
			const linkRow = listView.getByRole( 'row' ).filter( {
				has: page.getByRole( 'link', {
					name: 'Top Level Item 2',
					exact: true,
				} ),
			} );

			await linkRow.getByRole( 'gridcell' ).first().hover();
			await linkRow.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();

			// The new submenu ends with its own appender while its new link
			// waits for a page.
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 3, 2, 2, 1 ] );

			// Closing the page search removes the new link, and the submenu
			// it leaves empty turns back into a link.
			await page.keyboard.press( 'Escape' );
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 3, 2, 1 ] );

			// An empty submenu would show an appender while selected, and a
			// link never does.
			await listView
				.getByRole( 'gridcell', {
					name: 'Top Level Item 2',
					exact: true,
				} )
				.click();
			await expect
				.poll( () => appenderLevels( listView ) )
				.toEqual( [ 3, 2, 1 ] );
		} );
	} );

	test( 'can add submenu links from the Options menu', async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Add Submenu Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const row = listView.getByRole( 'row', { name: 'Existing Item' } );

		await test.step( 'a link becomes a submenu holding the new link', async () => {
			await row.hover();
			await row.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 1' } )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
		} );

		await test.step( 'a submenu gets the new link at its end', async () => {
			await row.hover();
			await row.getByRole( 'button', { name: 'Options' } ).click();
			await page
				.getByRole( 'menuitem', { name: 'Add submenu link' } )
				.click();
			await linkControl.useLinkControlSearch( 'Test Page 2' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 2' } )
					.filter( { hasText: 'Block 2 of 2, Level 2.' } )
			).toBeVisible();
		} );
	} );

	test( "returns focus to the item's Options after adding a submenu link", async ( {
		admin,
		page,
		requestUtils,
		linkControl,
	} ) => {
		const createdMenu = await requestUtils.createNavigationMenu( {
			title: 'Focus Return Menu',
			content:
				'<!-- wp:navigation-link {"label":"Existing Item","type":"custom","url":"https://wordpress.org/1","kind":"custom"} /-->',
		} );

		await admin.visitSiteEditor( {
			postId: createdMenu?.id,
			postType: 'wp_navigation',
		} );

		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const row = listView.getByRole( 'row', { name: 'Existing Item' } );
		const optionsButton = row.getByRole( 'button', { name: 'Options' } );
		const addSubmenuLink = page.getByRole( 'menuitem', {
			name: 'Add submenu link',
		} );

		await test.step( 'when the link search is dismissed', async () => {
			await row.hover();
			await optionsButton.click();
			await addSubmenuLink.click();
			await expect( linkControl.getLinkControlSearch() ).toBeFocused();
			await page.keyboard.press( 'Escape' );
			await expect( optionsButton ).toBeFocused();
		} );

		await test.step( 'when a link is chosen', async () => {
			await page.keyboard.press( 'Enter' );
			await addSubmenuLink.click();
			await linkControl.useLinkControlSearch( 'Test Page 1' );
			await expect(
				listView
					.getByRole( 'gridcell', { name: 'Test Page 1' } )
					.filter( { hasText: 'Block 1 of 1, Level 2.' } )
			).toBeVisible();
			await expect( optionsButton ).toBeFocused();
		} );
	} );
} );

class LinkControl {
	constructor( { page } ) {
		this.page = page;
	}

	getLinkControlSearch() {
		return this.page.getByRole( 'combobox', {
			name: 'Search or type URL',
		} );
	}

	async useLinkControlSearch( searchTerm ) {
		await expect( this.getLinkControlSearch() ).toBeFocused();

		await this.page.keyboard.type( searchTerm, { delay: 50 } );

		const searchResults = this.page.getByRole( 'listbox', {
			name: 'Search results',
		} );
		await expect( searchResults ).toBeVisible();

		// Click the matching result directly rather than pressing ArrowDown +
		// Enter. The search is debounced, so the top result can still be a
		// stale suggestion when the list first appears, and Enter would
		// select it.
		await searchResults.getByRole( 'option', { name: searchTerm } ).click();
	}
}
