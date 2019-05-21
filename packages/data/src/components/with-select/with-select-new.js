/**
 * WordPress dependencies
 */
import { createHigherOrderComponent, pure } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useSelect from '../use-select';

const withSelect = ( mapSelectToProps ) => createHigherOrderComponent(
	( WrappedComponent ) => pure(
		( ownProps ) => {
			const mapSelect =
				( select, registry ) => mapSelectToProps(
					select,
					ownProps,
					registry
				);
			const mergeProps = useSelect( mapSelect );
			return <WrappedComponent { ...ownProps } { ...mergeProps } />;
		}
	),
	'withSelect'
);

export default withSelect;
