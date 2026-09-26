import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import { __ } from '@wordpress/i18n';
import {
	getBlockBindingsSource,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	__experimentalItem as Item,
	__experimentalText as WCText,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
import BlockContext from '../block-context';
import BlockBindingsSourceFieldsList from './source-fields-list';
import useBlockBindingsUtils from './use-block-bindings-utils';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

/**
 * Renders a control for viewing and editing a block attribute binding.
 *
 * @param {Object} root0           Component props.
 * @param {string} root0.attribute The block attribute name.
 * @param {Object} [root0.binding] The current block binding.
 * @param {string} root0.blockName The block type name.
 *
 * @return {Element} The block attribute binding control.
 */
export default function BlockBindingsAttributeControl( {
	attribute,
	binding,
	blockName,
} ) {
	const { updateBlockBindings } = useBlockBindingsUtils();
	const isMobile = useViewportMatch( 'medium', '<' );

	const blockContext = useContext( BlockContext );
	const compatibleFields = useSelect(
		( select ) => {
			const {
				getAllBlockBindingsSources,
				getBlockBindingsSourceFieldsList,
				getBlockType,
			} = unlock( select( blocksStore ) );

			const _attribute =
				getBlockType( blockName ).attributes?.[ attribute ];

			if ( _attribute?.enum ) {
				return {};
			}

			const attributeType =
				_attribute?.type === 'rich-text' ? 'string' : _attribute?.type;

			const sourceFields = {};
			Object.entries( getAllBlockBindingsSources() ).forEach(
				( [ sourceName, source ] ) => {
					const fieldsList = getBlockBindingsSourceFieldsList(
						source,
						blockContext
					);
					if ( ! fieldsList?.length ) {
						return;
					}
					const compatibleFieldsList = fieldsList.filter(
						( field ) => field.type === attributeType
					);
					if ( compatibleFieldsList.length ) {
						sourceFields[ sourceName ] = compatibleFieldsList;
					}
				}
			);
			return sourceFields;
		},
		[ attribute, blockName, blockContext ]
	);

	const { canUpdateBlockBindings } = useSelect( ( select ) => ( {
		canUpdateBlockBindings:
			select( blockEditorStore ).getSettings().canUpdateBlockBindings,
	} ) );

	const hasCompatibleFields = Object.keys( compatibleFields ).length > 0;

	// Lock the UI when the user can't update bindings or there are no fields to connect to.
	const isAttributeReadOnly =
		! canUpdateBlockBindings || ! hasCompatibleFields;

	const { source: boundSourceName, args } = binding || {};
	const source = getBlockBindingsSource( boundSourceName );

	let displayText;
	let isValid = true;

	if ( binding === undefined ) {
		if ( ! hasCompatibleFields ) {
			displayText = __( 'No sources available' );
		} else {
			displayText = __( 'Not connected' );
		}
		isValid = true;
	} else if ( ! source ) {
		// If there's a binding but the source is not found, it's invalid.
		isValid = false;
		displayText = __( 'Source not registered' );
	} else {
		displayText =
			compatibleFields?.[ boundSourceName ]?.find( ( field ) =>
				fastDeepEqual( field.args, args )
			)?.label ||
			source?.label ||
			boundSourceName;
	}

	return (
		<ToolsPanelItem
			hasValue={ () => !! binding }
			label={ attribute }
			onDeselect={
				!! hasCompatibleFields &&
				( () => {
					updateBlockBindings( {
						[ attribute ]: undefined,
					} );
				} )
			}
		>
			<Menu.Root disabled={ ! hasCompatibleFields }>
				<Menu.Trigger render={ <Item /> }>
					<VStack
						className="block-editor-bindings__item"
						spacing={ 0 }
					>
						<WCText truncate>{ attribute }</WCText>
						<WCText
							truncate
							variant={ isValid ? 'muted' : undefined }
							isDestructive={ ! isValid }
						>
							{ displayText }
						</WCText>
					</VStack>
				</Menu.Trigger>
				{ ! isAttributeReadOnly && (
					<Menu.Popup
						positioner={
							<Menu.Positioner
								side={ isMobile ? 'bottom' : 'inline-start' }
								align="start"
								sideOffset={ isMobile ? 8 : 36 }
							/>
						}
					>
						{ Object.entries( compatibleFields ).map(
							( [ sourceKey, fields ] ) => (
								<BlockBindingsSourceFieldsList
									key={ sourceKey }
									args={ binding?.args }
									attribute={ attribute }
									sourceKey={ sourceKey }
									fields={ fields }
								/>
							)
						) }
					</Menu.Popup>
				) }
			</Menu.Root>
		</ToolsPanelItem>
	);
}
