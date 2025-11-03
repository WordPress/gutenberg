/**
 * WordPress dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockSwitcher from '../block-switcher';
import BlockIcon from '../block-icon';
import PatternOverridesDropdown from './pattern-overrides-dropdown';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

/**
 * Renders the block toolbar icon, which can be:
 * - A BlockSwitcher dropdown (when transforms/styles are available)
 * - A Pattern Overrides dropdown (when block has pattern overrides)
 * - A disabled button (when neither condition is met)
 *
 * @param {Object}  props                      Component props.
 * @param {Array}   props.clientIds            The client IDs of selected blocks.
 * @param {Object}  props.icon                 The icon data.
 * @param {boolean} props.showBlockSwitcher    Whether to show the full block switcher.
 * @param {boolean} props.showPatternOverrides Whether to show pattern overrides dropdown.
 * @param {string}  props.firstBlockName       The metadata name of the first block (for overrides).
 * @return {JSX.Element} The block toolbar icon component.
 */
export default function BlockToolbarIcon( {
	clientIds,
	icon,
	showBlockSwitcher,
	showPatternOverrides,
	firstBlockName,
} ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId: clientIds?.[ 0 ],
		maximumLength: 35,
	} );

	const isSingleBlock = clientIds.length === 1;
	const label = isSingleBlock ? blockTitle : __( 'Multiple blocks selected' );

	// Pattern overrides description
	let patternOverridesDescription;
	if ( showPatternOverrides ) {
		if ( isSingleBlock && firstBlockName ) {
			patternOverridesDescription = sprintf(
				/* translators: 1: The block type's name. 2: The block's user-provided name (the same as the override name). */
				__( 'This %1$s is editable using the "%2$s" override.' ),
				blockTitle.toLowerCase(),
				firstBlockName
			);
		} else {
			patternOverridesDescription = __(
				'These blocks are editable using overrides.'
			);
		}
	}

	const descriptionId = useId();

	const BlockIconElement = <BlockIcon icon={ icon } />;

	if ( showBlockSwitcher ) {
		return (
			<BlockSwitcher clientIds={ clientIds }>
				{ BlockIconElement }
			</BlockSwitcher>
		);
	}

	if ( showPatternOverrides ) {
		return (
			<PatternOverridesDropdown
				icon={ BlockIconElement }
				label={ label }
				description={ patternOverridesDescription }
				descriptionId={ descriptionId }
			/>
		);
	}

	return (
		<ToolbarButton
			disabled
			className="block-editor-block-toolbar__block-icon-button"
			title={ label }
			icon={ BlockIconElement }
		/>
	);
}
