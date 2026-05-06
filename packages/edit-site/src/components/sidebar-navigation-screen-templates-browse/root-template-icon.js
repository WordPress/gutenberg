/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/primitives';

/**
 * Mirror of the `core/template-content` block icon. Lives in `edit-site`
 * because the block-library copy is private; sharing one source file
 * between the two sidebar variants (new + legacy) keeps them in sync.
 */
const rootTemplateIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M18 5.5H6a.5.5 0 00-.5.5v3h13V6a.5.5 0 00-.5-.5zm-10 5H5.5V18a.5.5 0 00.5.5h2.5v-8zM6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z" />
		<Path d="M10 10.5h8.5V18a.5.5 0 01-.5.5h-8z" />
	</SVG>
);

export default rootTemplateIcon;
