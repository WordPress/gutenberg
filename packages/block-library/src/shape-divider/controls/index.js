/**
 * WordPress dependencies
 */
import { BlockControls, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import FlipToolbarGroup from './flip-toolbar-group';
import ShapeDividerPanel from './shape-divider-panel';
import ShapesPanel from './shapes-panel';

const ShapeDividerControls = ( props ) => (
	<>
		<BlockControls>
			<FlipToolbarGroup { ...props } />
		</BlockControls>
		<InspectorControls>
			<ShapeDividerPanel { ...props } />
			<ShapesPanel { ...props } />
		</InspectorControls>
	</>
);

export default ShapeDividerControls;
