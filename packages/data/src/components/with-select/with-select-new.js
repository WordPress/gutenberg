/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useSelect from '../use-select';

const withSelect = ( mapSelectToProps ) => createHigherOrderComponent(
	( WrappedComponent ) => ( ownProps ) => {
		const mapSelect =
			( select, registry ) => mapSelectToProps(
				select,
				ownProps,
				registry
			);
		const mergeProps = useSelect( mapSelect, ownProps );
		return <WrappedComponent { ...ownProps } { ...mergeProps } />;
	},
	'withSelect'
);

export default withSelect;
