/**
 * Internal dependencies
 */
import { isAndroid } from './helpers/utils';

const initialHTML = `<!-- wp:paragraph {"style":{"color":{"text":"#fcb900"},"typography":{"fontSize":35.56}}} -->
<p class="has-text-color" style="color:#fcb900;font-size:35.56px">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed imperdiet ut nibh vitae ornare. Sed auctor nec augue at blandit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Suspendisse mattis tellus sem, ornare porttitor nisi efficitur vitae.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"1.44em"}}} -->
<p style="font-size:1.44em">Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nam blandit rhoncus hendrerit.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"2.11rem"}}} -->
<p style="font-size:2.11rem">Nulla consequat mollis ipsum, nec mattis velit varius non. In convallis aliquet ultrices. Morbi nec nibh et arcu porta tempus.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"style":{"typography":{"fontSize":"22px"}}} -->
<p style="font-size:22px">Cras accumsan lacus nunc, a dapibus tortor porta in.</p>
<!-- /wp:paragraph -->`;

describe( 'Gutenberg Editor Typography test', () => {
	it( 'should be able to create a post with custom typography', async () => {
		await editorPage.setHtmlContent( initialHTML );

		const lastBlockAccessibilityLabel =
			'Paragraph Block. Row 5. Cras accumsan lacus nunc, a dapibus tortor porta in.';
		let lastBlockElement;
		if ( isAndroid() ) {
			lastBlockElement = await editorPage.androidScrollAndReturnElement(
				lastBlockAccessibilityLabel
			);
		} else {
			lastBlockElement = await editorPage.getLastElementByXPath(
				lastBlockAccessibilityLabel
			);
			if ( ! lastBlockElement ) {
				const retryDelay = 5000;
				// eslint-disable-next-line no-console
				console.log(
					`Warning: "lastBlockElement" was not found in the first attempt. Could be that all the blocks were not loaded yet.
 Will retry one more time after ${ retryDelay / 1000 } seconds.`,
					lastBlockElement
				);
				await editorPage.driver.sleep( retryDelay );
				lastBlockElement = await editorPage.getLastElementByXPath(
					lastBlockAccessibilityLabel
				);
			}
		}

		expect( lastBlockElement ).toBeTruthy();
	} );
} );
