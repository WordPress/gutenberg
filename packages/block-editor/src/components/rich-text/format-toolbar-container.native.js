/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = () => {
	// Render regular toolbar
	return (
		<BlockControls segment="inline">
			<FormatToolbar />
		</BlockControls>
	);
};

export default FormatToolbarContainer;
