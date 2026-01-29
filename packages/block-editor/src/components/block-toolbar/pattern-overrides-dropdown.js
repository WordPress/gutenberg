/**
 * WordPress dependencies
 */
import {
	Popover,
	ToolbarButton,
	__experimentalText as Text,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Renders the content of the pattern overrides popover.
 * Only mounts when the popover is opened.
 *
 * @param {Object} props            Component props.
 * @param {Array}  props.clientIds  The client IDs of selected blocks.
 * @param {string} props.blockTitle The display title of the block.
 * @return {JSX.Element} The popover content.
 */
function PatternOverridesPopoverContent( { clientIds, blockTitle } ) {
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
 * @param {Object}      props            Component props.
 * @param {JSX.Element} props.icon       The icon element to display.
 * @param {Array}       props.clientIds  The client IDs of selected blocks.
 * @param {string}      props.blockTitle The display title of the block.
 * @param {string}      props.label      The label for the button.
 * @return {JSX.Element} The pattern overrides button component.
 */
export default function PatternOverridesDropdown( {
	icon,
	clientIds,
	blockTitle,
	label,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const anchorRef = useRef();

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
