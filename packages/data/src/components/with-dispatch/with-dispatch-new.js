/**
 * WordPress dependencies
 */
import { pure, createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useDispatchWithMap } from '../use-dispatch';

const withDispatch = ( mapDispatchToProps ) => createHigherOrderComponent(
	( WrappedComponent ) => pure(
		( ownProps ) => {
			const mapDispatch = ( dispatch, registry ) => mapDispatchToProps(
				dispatch,
				ownProps,
				registry
			);
			const dispatchProps = useDispatchWithMap( mapDispatch );
			return <WrappedComponent { ...ownProps } { ...dispatchProps } />;
		}
	),
	'withDispatch'
);

export default withDispatch;
