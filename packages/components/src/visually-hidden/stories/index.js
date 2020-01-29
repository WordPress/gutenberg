/**
 * Internal dependencies
 */
import VisuallyHidden from '../';

export default {
	title: 'Components/VisuallyHidden',
	component: VisuallyHidden,
};

export const _default = () => (
	<>
		<VisuallyHidden>This should not show.</VisuallyHidden>
		<div>
			This text will{ ' ' }
			<VisuallyHidden as="span">but not inline </VisuallyHidden> always
			show.
		</div>
	</>
);
