/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { escape } from './utils';
import { Button, Tooltip } from '@wordpress/components';

export default function save( { attributes } ) {
	return (
		<pre { ...useBlockProps.save() }>
			<Tooltip.Content text="Enabled button">
				<Button disabled>Enabled</Button>
			</Tooltip.Content>
			<RichText.Content
				tagName="code"
				value={ escape( attributes.content ) }
			/>
		</pre>
	);
}
