/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalText as WCText,
	__experimentalToolsPanel as ToolsPanel,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	BlockBindingsAttributeControl,
	useBlockBindingsUtils,
} from '../components/block-bindings';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';
import BlockContext from '../components/block-context';
import { store as blockEditorStore } from '../store';

/*
 * Per-block list of bindable attributes hidden from the Attributes panel.
 * Binding these attributes to incompatible sources through the generic UI
 * could break the block (e.g. binding the Date block's `datetime` attribute
 * to a non-date value). They remain bindable programmatically and through
 * dedicated UI, like the Date block's variations.
 */
const HIDDEN_BLOCK_BINDINGS_PANEL_ATTRIBUTES = {
	'core/post-date': [ 'datetime' ],
};

const useToolsPanelDropdownMenuProps = () => {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: 259,
				},
		  }
		: {};
};

export const BlockBindingsPanel = ( { name: blockName, metadata } ) => {
	const blockContext = useContext( BlockContext );
	const { removeAllBlockBindings, updateBlockBindings } =
		useBlockBindingsUtils();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { bindableAttributes, hasCompatibleFields } = useSelect(
		( select ) => {
			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();
			const {
				getAllBlockBindingsSources,
				getBlockBindingsSourceFieldsList,
			} = unlock( select( blocksStore ) );

			return {
				bindableAttributes:
					__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					],
				hasCompatibleFields: Object.values(
					getAllBlockBindingsSources()
				).some(
					( source ) =>
						getBlockBindingsSourceFieldsList( source, blockContext )
							?.length > 0
				),
			};
		},
		[ blockName, blockContext ]
	);

	const hiddenAttributes =
		HIDDEN_BLOCK_BINDINGS_PANEL_ATTRIBUTES[ blockName ];
	const visibleAttributes = hiddenAttributes
		? bindableAttributes?.filter(
				( attribute ) => ! hiddenAttributes.includes( attribute )
		  )
		: bindableAttributes;

	// Return early if there are no bindable attributes to show.
	if ( ! visibleAttributes || visibleAttributes.length === 0 ) {
		return null;
	}

	const { bindings } = metadata || {};
	const hasVisibleBindings = visibleAttributes.some(
		( attribute ) => bindings?.[ attribute ] !== undefined
	);

	if ( ! hasVisibleBindings && ! hasCompatibleFields ) {
		return null;
	}

	return (
		<InspectorControls group="bindings">
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					if ( hiddenAttributes?.length ) {
						// Only remove the bindings shown in the panel, leaving the hidden ones untouched.
						updateBlockBindings(
							Object.fromEntries(
								visibleAttributes.map( ( attribute ) => [
									attribute,
									undefined,
								] )
							)
						);
					} else {
						removeAllBlockBindings();
					}
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="block-editor-bindings__panel"
			>
				<ItemGroup isBordered isSeparated>
					{ visibleAttributes.map( ( attribute ) => (
						<BlockBindingsAttributeControl
							key={ attribute }
							attribute={ attribute }
							blockName={ blockName }
							binding={ bindings?.[ attribute ] }
						/>
					) ) }
				</ItemGroup>
				{ /*
					Use a div element to make the ToolsPanelHiddenInnerWrapper
					toggle the visibility of this help text automatically.
				*/ }
				<WCText as="div" variant="muted">
					<p>
						{ __(
							'Attributes connected to custom fields or other dynamic data.'
						) }
					</p>
				</WCText>
			</ToolsPanel>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport( name ) {
		return ! [ 'core/navigation-link', 'core/navigation-submenu' ].includes(
			name
		);
	},
};
