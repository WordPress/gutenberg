/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	return (
		<pre { ...useBlockWrapperProps.save() }>
			<RichText.Content
				tagName="code"
				value={ escape( attributes.content ) }
			/>
		</pre>
	);
}
