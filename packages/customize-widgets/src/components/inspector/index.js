/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';

export { default as BlockInspectorButton } from './block-inspector-button';

export default function Inspector() {
	return (
		<div className="customize-widgets-layout__inspector">
			<BlockInspector />
		</div>
	);
}
