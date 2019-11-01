/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const { Fill, Slot } = createSlotFill( 'ParentInspectorControls' );

function mapBlockEditContext( { clientId, isSelected } ) {
	return { clientId, isSelected };
}

function EnhancedFill( props ) {
	const { clientId, isSelected } = props;

	const hasSelectedInnerBlock = useSelect( ( select ) => {
		const searchDeep = true;
		return select( 'core/block-editor' ).hasSelectedInnerBlock( clientId, searchDeep );
	}, [ clientId ] );

	if ( ! hasSelectedInnerBlock && ! isSelected ) {
		return null;
	}

	return (
		<Fill { ...props } />
	);
}

const ParentInspectorControls = withBlockEditContext( mapBlockEditContext )( EnhancedFill );

ParentInspectorControls.Slot = Slot;

export default ParentInspectorControls;
