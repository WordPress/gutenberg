/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSelect from '../use-select';

const withSelect = ( mapSelectToProps ) => createHigherOrderComponent(
	( WrappedComponent ) => ( ownProps ) => {
		const mapSelect = useCallback(
			( select, registry ) => mapSelectToProps(
				select,
				ownProps,
				registry
			),
			[ ownProps ]
		);
		const mergeProps = useSelect( mapSelect );
		return <WrappedComponent { ...ownProps } { ...mergeProps } />;
	},
	'withSelect'
);

export default withSelect;
