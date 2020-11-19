/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
/**
 * External dependencies
 */
import { CompositeGroup } from 'reakit/Composite';

/**
 * Internal dependencies
 */
import InserterListboxContext from './context';

function InserterListboxRow( props, ref ) {
	const state = useContext( InserterListboxContext );
	return (
		<CompositeGroup
			state={ state }
			role="presentation"
			ref={ ref }
			{ ...props }
		/>
	);
}

export default forwardRef( InserterListboxRow );
