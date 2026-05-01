/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

type RestField = { raw?: string; rendered?: string } | string;
type RestPage = {
	content?: RestField;
	id: number;
	status?: string;
	title?: RestField;
};
type RequestUtilsLike = {
	rest: < T >( options: {
		data?: Record< string, unknown >;
		method?: string;
		path: string;
	} ) => Promise< T >;
};

const TOGGLE_CODE_EDITOR_KEY =
	process.platform === 'darwin' ? 'Meta+Alt+Shift+M' : 'Control+Alt+Shift+M';

function paragraphMarkup( content: string ) {
	return `<!-- wp:paragraph --><p>${ content }</p><!-- /wp:paragraph -->`;
}

function pageContent( contents: string[] ) {
	return contents.map( paragraphMarkup ).join( '\n\n' );
}

function rawField( field?: RestField ): string {
	if ( ! field ) {
		return '';
	}

	return typeof field === 'string'
		? field
		: field.raw ?? field.rendered ?? '';
}

async function getPersistedPage(
	requestUtils: RequestUtilsLike,
	pageId: number
) {
	return requestUtils.rest< RestPage >( {
		path: `/wp/v2/pages/${ pageId }?context=edit`,
	} );
}

async function updatePersistedPageContent(
	requestUtils: RequestUtilsLike,
	pageId: number,
	content: string
) {
	await requestUtils.rest< RestPage >( {
		method: 'POST',
		path: `/wp/v2/pages/${ pageId }`,
		data: { content },
	} );
}

async function clickToolbarSave( page: any ) {
	const saveButton = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Save', exact: true } );

	await expect( saveButton ).toBeEnabled( { timeout: 30000 } );
	await saveButton.click();
}

async function switchToCodeEditor( page: any ) {
	await page.keyboard.press( TOGGLE_CODE_EDITOR_KEY );
	await expect(
		page.getByRole( 'heading', { name: 'Editing code' } )
	).toBeVisible();
	return page.getByRole( 'textbox', { name: 'Type text or HTML' } );
}

async function replaceCodeEditorContent( page: any, content: string ) {
	const codeEditor = page.getByRole( 'textbox', {
		name: 'Type text or HTML',
	} );

	await codeEditor.fill( content );
	await expect( codeEditor ).toHaveValue( content );
}

test.describe( 'Collaboration - same-user stale content overwrite', () => {
	// eslint-disable-next-line playwright/no-skipped-test
	test.skip( 'preserves saved page content when another same-account window saves a stale body', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120000 );

		const currentContentMarker = `same-account-current-${ Date.now() }`;
		const staleSessionMarker = `same-account-stale-${ Date.now() }`;
		const title = `Same-account stale page ${ Date.now() }`;
		const publishedPage = await requestUtils.createPage( {
			title,
			status: 'publish',
			date_gmt: new Date().toISOString(),
			content: pageContent( [ 'Alpha', 'Beta' ] ),
		} );

		await collaborationUtils.openPost( publishedPage.id );

		const codeEditor = await switchToCodeEditor( page );
		await expect( codeEditor ).toHaveValue( /Alpha/ );
		await expect( codeEditor ).toHaveValue( /Beta/ );

		await updatePersistedPageContent(
			requestUtils,
			publishedPage.id,
			pageContent( [ 'Alpha', 'Beta', currentContentMarker ] )
		);

		await expect
			.poll(
				async () =>
					rawField(
						(
							await getPersistedPage(
								requestUtils,
								publishedPage.id
							)
						).content
					),
				{ timeout: 30000 }
			)
			.toContain( currentContentMarker );

		await replaceCodeEditorContent(
			page,
			pageContent( [ staleSessionMarker, 'Beta' ] )
		);
		await clickToolbarSave( page );

		await expect
			.poll(
				async () =>
					rawField(
						(
							await getPersistedPage(
								requestUtils,
								publishedPage.id
							)
						).content
					),
				{ timeout: 30000 }
			)
			.toContain( staleSessionMarker );
		const persistedPage = await getPersistedPage(
			requestUtils,
			publishedPage.id
		);
		const persistedContent = rawField( persistedPage.content );

		expect( persistedPage.status ).toBe( 'publish' );
		expect( rawField( persistedPage.title ) ).toContain( title );
		expect( persistedContent ).toContain( staleSessionMarker );
		expect( persistedContent ).toContain( currentContentMarker );
	} );
} );
