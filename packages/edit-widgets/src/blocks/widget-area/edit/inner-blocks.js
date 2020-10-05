/**
 * WordPress dependencies
 */
import { useEntityBlockEditor } from '@wordpress/core-data';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { KIND, EDITOR_TYPE } from '../../../store/utils';

export default function WidgetAreaInnerBlocks() {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		KIND,
		EDITOR_TYPE
	);
	return (
		<InnerBlocks
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			templateLock={ false }
		/>
	);
}
