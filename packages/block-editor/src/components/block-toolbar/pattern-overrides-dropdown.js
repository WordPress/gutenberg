/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	ToolbarItem,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useId } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Renders a dropdown menu that displays information about pattern overrides.
 *
 * @param {Object}      props            Component props.
 * @param {JSX.Element} props.icon       The icon element to display.
 * @param {Array}       props.clientIds  The client IDs of selected blocks.
 * @param {string}      props.blockTitle The display title of the block.
 * @return {JSX.Element} The pattern overrides dropdown component.
 */
export default function PatternOverridesDropdown( {
	icon,
	clientIds,
	blockTitle,
} ) {
	const blockMetaName = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientIds?.[ 0 ] )?.metadata?.name;
		},
		[ clientIds ]
	);

	const isSingleBlock = clientIds.length === 1;
	const label = isSingleBlock ? blockTitle : __( 'Multiple blocks selected' );

	// Pattern overrides description
	let description;
	if ( isSingleBlock && blockMetaName ) {
		description = sprintf(
			/* translators: 1: The block type's name. 2: The block's user-provided name (the same as the override name). */
			__( 'This %1$s is editable using the "%2$s" override.' ),
			blockTitle.toLowerCase(),
			blockMetaName
		);
	} else {
		description = __( 'These blocks are editable using overrides.' );
	}

	const descriptionId = useId();

	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<DropdownMenu
					className="block-editor-block-toolbar__pattern-overrides-indicator"
					label={ label }
					popoverProps={ {
						placement: 'bottom-start',
						className:
							'block-editor-block-toolbar__pattern-overrides-popover',
					} }
					icon={ icon }
					toggleProps={ {
						description,
						...toggleProps,
					} }
					menuProps={ {
						orientation: 'both',
						'aria-describedby': descriptionId,
					} }
				>
					{ () => <Text id={ descriptionId }>{ description }</Text> }
				</DropdownMenu>
			) }
		</ToolbarItem>
	);
}
