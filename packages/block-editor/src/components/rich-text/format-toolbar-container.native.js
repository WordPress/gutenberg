/**
 * Internal dependencies
 */
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';

const FormatToolbarContainer = () => {
	// Render regular toolbar
	return (
		<BlockFormatControls>
			<FormatToolbar />
		</BlockFormatControls>
	);
};

export default FormatToolbarContainer;
