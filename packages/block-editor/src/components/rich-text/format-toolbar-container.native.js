/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = ( { isCompactMode } ) => {
	// Render regular toolbar.
	return (
		<BlockControls group="inline">
			<FormatToolbar isCompactMode={ isCompactMode } />
		</BlockControls>
	);
};

export default FormatToolbarContainer;
