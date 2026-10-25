import { Popover, ToolbarButton } from '@wordpress/components';
import { Text } from '@wordpress/ui';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '../../store';
import type {
	PatternOverridesDropdownProps,
	PatternOverridesPopoverContentProps,
} from './types';

/**
 * Renders the content of the pattern overrides popover.
 * Only mounts when the popover is opened.
 *
 * @param props            Component props.
 * @param props.clientIds  The client IDs of selected blocks.
 * @param props.blockTitle The display title of the block.
 * @return The popover content.
 */
function PatternOverridesPopoverContent( {
	clientIds,
	blockTitle,
}: PatternOverridesPopoverContentProps ) {
	const blockMetaName = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );
			return getBlockAttributes( clientIds?.[ 0 ] )?.metadata?.name;
		},
		[ clientIds ]
	);

	const isSingleBlock = clientIds.length === 1;

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

	return <Text>{ description }</Text>;
}

/**
 * Renders a toolbar button that displays information about pattern overrides in a popover.
 *
 * @param props            Component props.
 * @param props.icon       The icon element to display.
 * @param props.clientIds  The client IDs of selected blocks.
 * @param props.blockTitle The display title of the block.
 * @param props.label      The label for the button.
 * @return The pattern overrides button component.
 */
export default function PatternOverridesDropdown( {
	icon,
	clientIds,
	blockTitle,
	label,
}: PatternOverridesDropdownProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const anchorRef = useRef< HTMLButtonElement >( null );

	return (
		<>
			<ToolbarButton
				ref={ anchorRef }
				className="block-editor-block-toolbar__pattern-overrides-indicator"
				icon={ icon }
				label={ label }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
			/>
			{ isOpen && (
				<Popover
					anchor={ anchorRef.current }
					onClose={ () => setIsOpen( false ) }
					placement="bottom-start"
					offset={ 16 }
					className="block-editor-block-toolbar__pattern-overrides-popover"
				>
					<PatternOverridesPopoverContent
						clientIds={ clientIds }
						blockTitle={ blockTitle }
					/>
				</Popover>
			) }
		</>
	);
}
