/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlock( componentsPrivateApis );

function BlockInspectorButton( { inspector, ...props } ) {
	const selectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
		[]
	);

	const selectedBlock = useMemo(
		() => document.getElementById( `block-${ selectedBlockClientId }` ),
		[ selectedBlockClientId ]
	);

	return (
		/* TODO: check if this used in other legacy dropdown menus */
		<DropdownMenuItemV2
			onSelect={ () => {
				// Open the inspector.
				inspector.open( {
					returnFocusWhenClose: selectedBlock,
				} );
			} }
			{ ...props }
		>
			{ __( 'Show more settings' ) }
		</DropdownMenuItemV2>
	);
}

export default BlockInspectorButton;
