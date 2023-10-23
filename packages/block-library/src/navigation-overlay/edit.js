/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

const NavigationOverlayEdit = () => {
	const props = useBlockProps();

	return (
		<>
			<div { ...props }>hello</div>
		</>
	);
};

export default NavigationOverlayEdit;
