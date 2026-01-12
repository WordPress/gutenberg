/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalText as Text,
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
	const { removeAllBlockBindings } = useBlockBindingsUtils();
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

	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}

	const { bindings } = metadata || {};

	if ( bindings === undefined && ! hasCompatibleFields ) {
		return null;
	}

	return (
		<InspectorControls group="bindings">
			<ToolsPanel
				label={ __( 'Attributes' ) }
				resetAll={ () => {
					removeAllBlockBindings();
				} }
				dropdownMenuProps={ dropdownMenuProps }
				className="block-editor-bindings__panel"
			>
				<ItemGroup isBordered isSeparated>
					{ bindableAttributes.map( ( attribute ) => (
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
				<Text as="div" variant="muted">
					<p>
						{ __(
							'Attributes connected to custom fields or other dynamic data.'
						) }
					</p>
				</Text>
			</ToolsPanel>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport( name ) {
		return ! [
			'core/post-date',
			'core/navigation-link',
			'core/navigation-submenu',
		].includes( name );
	},
};
