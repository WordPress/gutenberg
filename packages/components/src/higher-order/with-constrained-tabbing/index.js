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
			return (
				<div ref={ ref } tabIndex="-1">
					<WrappedComponent { ...props } />
				</div>
			);
		},
	'withConstrainedTabbing'
);

export default withConstrainedTabbing;
