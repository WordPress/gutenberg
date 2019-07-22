/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ifBlockEditSelected, withBlockEditContext } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'InspectorControls' );

const InspectorControls = withBlockEditContext( ( { isReadOnly } ) => ( { isReadOnly } ) )( ifBlockEditSelected( ( { isReadOnly, ...props } ) => {
	if ( isReadOnly ) {
		return null;
	}

	return <Fill { ...props } />;
} ) );

InspectorControls.Slot = Slot;

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inspector-controls/README.md
 */
export default InspectorControls;
