/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText } from '@wordpress/block-editor';

export default ( { attributes } ) => {
	return (
		<details open={ attributes.initialOpen }>
			<RichText.Content
				tagName="summary"
				value={ attributes.summaryContent }
			/>
			<InnerBlocks.Content />
		</details>
	);
};
