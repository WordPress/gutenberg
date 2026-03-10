# ContentGuidelineSectionActions

This SlotFill allows plugins to render additional action buttons next to the "Save guidelines" button in each section of the Content Guidelines admin page.

## Available Sections

Each guideline section exposes its own slot using the naming pattern `ContentGuidelineSectionActions/{slug}`:

-   `ContentGuidelineSectionActions/site`
-   `ContentGuidelineSectionActions/copy`
-   `ContentGuidelineSectionActions/images`
-   `ContentGuidelineSectionActions/additional`

## Available Fill Props

-   **section** `string`: The guideline section identifier (`site`, `copy`, `images`, or `additional`).
-   **content** `string`: The current content of the section's textarea.
-   **setContentGuideline** `(text: string) => void`: Callback to update the section's textarea content.

## Example

```js
import { registerPlugin } from '@wordpress/plugins';
import { Fill, Button } from '@wordpress/components';

const SECTIONS = [ 'site', 'copy', 'images', 'additional' ];

const ContentGuidelinesActionDemo = () => (
	<>
		{ SECTIONS.map( ( section ) => (
			<Fill
				key={ section }
				name={ `ContentGuidelineSectionActions/${ section }` }
			>
				{ ( { section, content, setContentGuideline } ) => (
					<Button
						variant="secondary"
						onClick={ () =>
							setContentGuideline( content + '\nGenerated content for ' + section )
						}
					>
						Generate
					</Button>
				) }
			</Fill>
		) ) }
	</>
);

registerPlugin( 'content-guidelines-action-demo', {
	scope: 'content-guidelines',
	render: ContentGuidelinesActionDemo,
} );
```
