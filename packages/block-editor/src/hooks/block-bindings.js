/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blockStore } from '@wordpress/blocks';
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
	BlockBindingsPanelItem,
	BlockBindingsPanelMenuContent,
	getAttributeType,
} from '../components/block-bindings';
import { useBlockBindingsUtils } from '../utils/block-bindings';
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

	// Use useSelect to ensure sources are updated whenever there are updates in block context
	// or when underlying data changes.
	const { canUpdateBlockBindings, bindableAttributes } = useSelect(
		( select ) => {
			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();

			return {
				canUpdateBlockBindings:
					select( blockEditorStore ).getSettings()
						.canUpdateBlockBindings,
				bindableAttributes:
					__experimentalBlockBindingsSupportedAttributes?.[
						blockName
					],
			};
		},
		[ blockName ]
	);

	const sources = useSelect(
		( select ) => {
			const { getAllBlockBindingsSources } = unlock(
				select( blockStore )
			);
			const data = {};
			Object.entries( getAllBlockBindingsSources() ).forEach(
				( [ sourceName, source ] ) => {
					if ( ! source.getFieldsList ) {
						return;
					}

					const context = {};
					if ( source.usesContext?.length ) {
						for ( const key of source.usesContext ) {
							context[ key ] = blockContext[ key ];
						}
					}

					const items = source.getFieldsList( {
						select,
						context,
					} );
					if ( items?.length ) {
						data[ sourceName ] = items;
					}
				}
			);
			return data;
		},
		[ blockContext ]
	);

	// Return early if there are no bindable attributes.
	if ( ! bindableAttributes || bindableAttributes.length === 0 ) {
		return null;
	}

	const { bindings } = metadata || {};

	const hasCompatibleData = Object.keys( sources ).length > 0;

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const readOnly = ! canUpdateBlockBindings || ! hasCompatibleData;

	if ( bindings === undefined && ! hasCompatibleData ) {
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
					{ bindableAttributes.map( ( attribute ) => {
						const binding = bindings?.[ attribute ];

						// Check if this specific attribute has compatible data from any source.
						const attributeType = getAttributeType(
							blockName,
							attribute
						);

						const hasCompatibleDataForAttribute = Object.values(
							sources
						).some( ( data ) =>
							data.some( ( item ) => item.type === attributeType )
						);

						const isAttributeReadOnly =
							readOnly || ! hasCompatibleDataForAttribute;

						if ( isAttributeReadOnly ) {
							return (
								<BlockBindingsPanelItem
									key={ attribute }
									attribute={ attribute }
									binding={ binding }
									sources={ sources }
									blockName={ blockName }
								/>
							);
						}

						return (
							<BlockBindingsPanelItem
								key={ attribute }
								attribute={ attribute }
								binding={ binding }
								sources={ sources }
								blockName={ blockName }
							>
								<BlockBindingsPanelMenuContent
									attribute={ attribute }
									binding={ binding }
									sources={ sources }
								/>
							</BlockBindingsPanelItem>
						);
					} ) }
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
