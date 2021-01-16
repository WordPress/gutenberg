/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import { __unstableCompositeGroup as CompositeGroup } from '@wordpress/components';

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
