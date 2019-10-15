/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	return (
		<li>
			<input
				type="checkbox"
				className={ 'wp-block-checklist-item__checked' }
				checked={ attributes.checked }
			/>
			<RichText.Content
				tagName="span"
				className={ 'wp-block-checklist-item__value' }
				value={ attributes.value }
			/>
		</li>
	);
}
