/**
 * Internal dependencies
 */
import VisuallyHidden from '../';

export default { title: 'VisuallyHidden', component: VisuallyHidden };

export const _default = () => (
	<>
		<VisuallyHidden>
			This should not show.
		</VisuallyHidden>
		<div>
			This text will always show.
		</div>
	</>
);
