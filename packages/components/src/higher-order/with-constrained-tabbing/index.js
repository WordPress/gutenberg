/**
 * WordPress dependencies
 */
import {
	createHigherOrderComponent,
	useConstrainedTabbing,
} from '@wordpress/compose';

const withConstrainedTabbing = createHigherOrderComponent(
	( WrappedComponent ) =>
		function ComponentWithConstrainedTabbing( props ) {
			const ref = useConstrainedTabbing();
			// Disable reason: this component is non-interactive, but must capture
			// events from the wrapped component to determine when the Tab key is used.
			/* eslint-disable jsx-a11y/no-static-element-interactions */
			return (
				<div ref={ ref } tabIndex="-1">
					<WrappedComponent { ...props } />
				</div>
			);
			/* eslint-enable jsx-a11y/no-static-element-interactions */
		},
	'withConstrainedTabbing'
);

export default withConstrainedTabbing;
