/**
 * Internal dependencies
 */
import { VisuallyHidden } from '..';

export default {
	title: 'G2 Components (Experimental)/VisuallyHidden',
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

export const withForwardedProps = () => (
	<>
		Additional props can be passed to VisuallyHidden and are forwarded to
		the rendered element.{ ' ' }
		<VisuallyHidden as="span" data-id="test">
			Check out my data attribute!{ ' ' }
		</VisuallyHidden>
		Inspect the HTML to see!
	</>
);

export const withAdditionalClassNames = () => (
	<>
		Additional class names passed to VisuallyHidden extend the component
		class name.{ ' ' }
		<VisuallyHidden as="label" className="test-input">
			Check out my class!{ ' ' }
		</VisuallyHidden>
		Inspect the HTML to see!
	</>
);
