/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalHStack as HStack,
	Icon,
	Navigator,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import useBlockDisplayInformation from '../use-block-display-information';
import { useInspectorPopoverPlacement } from './use-inspector-popover-placement';

// controls
import PlainText from './plain-text';
import RichText from './rich-text';
import Media from './media';
import Link from './link';

const controls = {
	PlainText,
	RichText,
	Media,
	Link,
};

function BlockAttributeToolsPanelItem( {
	clientId,
	control,
	blockType,
	attributeValues,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const { selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const { isBlockSelected } = useSelect( blockEditorStore );
	const ControlComponent = controls[ control.type ];

	if ( ! ControlComponent ) {
		return null;
	}

	const isSelected = isBlockSelected( clientId );

	const handleClick = () => {
		// Navigate to block without changing focus (keeps focus in sidebar)
		// Pass `null` as second parameter to prevent focusing the block
		if ( ! isSelected ) {
			selectBlock( clientId, null );
			toggleBlockSpotlight( clientId, true );
		}
		// Don't prevent propagation so clicks can reach child elements (like input fields)
	};

	const handleFocusCapture = ( event ) => {
		// Navigate to block when child controls receive focus (keyboard navigation)
		// Only trigger if focus is actually on a child element, not the wrapper itself
		if ( event.target !== event.currentTarget ) {
			// Pass `null` as second parameter to prevent focusing the block
			if ( ! isSelected ) {
				selectBlock( clientId, null );
				toggleBlockSpotlight( clientId, true );
			}
		}
	};

	return (
		// Keyboard navigation is handled via onFocusCapture when child controls receive focus.
		// The wrapper itself is not focusable (no tabIndex) to avoid extra tab stops.
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
		<div
			className="block-editor-content-only-controls__item-wrapper"
			onClick={ handleClick }
			onFocusCapture={ handleFocusCapture }
		>
			<ControlComponent
				clientId={ clientId }
				control={ control }
				blockType={ blockType }
				attributeValues={ attributeValues }
				updateAttributes={ ( attributes ) =>
					updateBlockAttributes( clientId, attributes )
				}
			/>
		</div>
	);
}

function BlockFields( { clientId } ) {
	const { attributes, blockType } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockName } =
				select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const blockName = getBlockName( clientId );
			return {
				attributes: getBlockAttributes( clientId ),
				blockType: getBlockType( blockName ),
			};
		},
		[ clientId ]
	);

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );
	const popoverPlacementProps = useInspectorPopoverPlacement();

	if ( ! blockType?.fields?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no fields.
		// for example, a way to select the block.
		return null;
	}

	return (
		<ToolsPanel
			label={
				<HStack spacing={ 1 }>
					<BlockIcon icon={ blockInformation?.icon } />
					<div>{ blockTitle }</div>
				</HStack>
			}
			panelId={ clientId }
			dropdownMenuProps={ popoverPlacementProps }
		>
			{ blockType?.fields?.map( ( field, index ) => (
				<BlockAttributeToolsPanelItem
					key={ `${ clientId }/${ index }` }
					clientId={ clientId }
					control={ field }
					blockType={ blockType }
					attributeValues={ attributes }
				/>
			) ) }
		</ToolsPanel>
	);
}

function DrillDownButton( { clientId } ) {
	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );
	return (
		<div className="block-editor-content-only-controls__button-panel">
			<Navigator.Button
				path={ `/${ clientId }` }
				className="block-editor-content-only-controls__drill-down-button"
			>
				<HStack expanded justify="space-between">
					<HStack justify="flex-start" spacing={ 1 }>
						<BlockIcon icon={ blockInformation?.icon } />
						<div>{ blockTitle }</div>
					</HStack>
					<Icon icon={ arrowRight } />
				</HStack>
			</Navigator.Button>
		</div>
	);
}

function ContentOnlyControlsScreen( {
	rootClientId,
	contentClientIds,
	parentClientIds,
	isNested,
} ) {
	const isRootContentBlock = useSelect(
		( select ) => {
			const { getBlockName } = select( blockEditorStore );
			const blockName = getBlockName( rootClientId );
			const { hasContentRoleAttribute } = unlock( select( blocksStore ) );
			return hasContentRoleAttribute( blockName );
		},
		[ rootClientId ]
	);

	if ( ! isRootContentBlock && ! contentClientIds.length ) {
		return null;
	}

	return (
		<>
			{ isNested && (
				<div className="block-editor-content-only-controls__button-panel">
					<Navigator.BackButton className="block-editor-content-only-controls__back-button">
						<HStack expanded spacing={ 1 } justify="flex-start">
							<Icon icon={ arrowLeft } />
							<div>{ __( 'Back' ) }</div>
						</HStack>
					</Navigator.BackButton>
				</div>
			) }
			{ isRootContentBlock && <BlockFields clientId={ rootClientId } /> }
			{ contentClientIds.map( ( clientId ) => {
				if ( parentClientIds?.[ clientId ] ) {
					return (
						<DrillDownButton
							key={ clientId }
							clientId={ clientId }
						/>
					);
				}

				return <BlockFields key={ clientId } clientId={ clientId } />;
			} ) }
		</>
	);
}

export default function ContentOnlyControls( { rootClientId } ) {
	const { updatedRootClientId, nestedContentClientIds, contentClientIds } =
		useSelect(
			( select ) => {
				const { getClientIdsOfDescendants, getBlockEditingMode } =
					select( blockEditorStore );

				// _nestedContentClientIds is for content blocks within 'drilldowns'.
				// It's an object where the key is the parent clientId, and the element is
				// an array of child clientIds whose controls are shown within the drilldown.
				const _nestedContentClientIds = {};

				// _contentClientIds is the list of contentClientIds for blocks being
				// shown at the root level. Includes parent blocks that might have a drilldown,
				// but not the children of those blocks.
				const _contentClientIds = [];

				// An array of all nested client ids. Used for ensuring blocks within drilldowns
				// don't appear at the root level.
				let allNestedClientIds = [];

				// A flattened list of all content clientIds to arrange into the
				// groups above.
				const allContentClientIds = getClientIdsOfDescendants(
					rootClientId
				).filter(
					( clientId ) =>
						getBlockEditingMode( clientId ) === 'contentOnly'
				);

				for ( const clientId of allContentClientIds ) {
					const childClientIds = getClientIdsOfDescendants(
						clientId
					).filter(
						( childClientId ) =>
							getBlockEditingMode( childClientId ) ===
							'contentOnly'
					);

					// If there's more than one child block, use a drilldown.
					if (
						childClientIds.length > 1 &&
						! allNestedClientIds.includes( clientId )
					) {
						_nestedContentClientIds[ clientId ] = childClientIds;
						allNestedClientIds = [
							allNestedClientIds,
							...childClientIds,
						];
					}

					if ( ! allNestedClientIds.includes( clientId ) ) {
						_contentClientIds.push( clientId );
					}
				}

				// Avoid showing only one drilldown block at the root.
				if (
					_contentClientIds.length === 1 &&
					Object.keys( _nestedContentClientIds ).length === 1
				) {
					const onlyParentClientId = Object.keys(
						_nestedContentClientIds
					)[ 0 ];
					return {
						updatedRootClientId: onlyParentClientId,
						contentClientIds:
							_nestedContentClientIds[ onlyParentClientId ],
						nestedContentClientIds: {},
					};
				}

				return {
					nestedContentClientIds: _nestedContentClientIds,
					contentClientIds: _contentClientIds,
				};
			},
			[ rootClientId ]
		);

	return (
		<Navigator initialPath="/">
			<Navigator.Screen
				path="/"
				className="block-editor-content-only-controls__screen"
			>
				<ContentOnlyControlsScreen
					rootClientId={ updatedRootClientId ?? rootClientId }
					contentClientIds={ contentClientIds }
					parentClientIds={ nestedContentClientIds }
				/>
			</Navigator.Screen>
			{ Object.keys( nestedContentClientIds ).map( ( clientId ) => (
				<Navigator.Screen
					key={ clientId }
					path={ `/${ clientId }` }
					className="block-editor-content-only-controls__screen"
				>
					<ContentOnlyControlsScreen
						isNested
						rootClientId={ clientId }
						contentClientIds={ nestedContentClientIds[ clientId ] }
					/>
				</Navigator.Screen>
			) ) }
		</Navigator>
	);
}
