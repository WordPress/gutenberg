/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	__experimentalHStack as HStack,
	Icon,
	Navigator,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
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
import { DataForm } from '@wordpress/dataviews';
import RichTextEdit from './data-form-controls/rich-text-edit';
import LinkEdit from './data-form-controls/link-edit';
import MediaEdit from './data-form-controls/media-edit';

/**
 * Maps field types to their corresponding DataForm Edit components
 */
const fieldTypeToEditComponent = {
	richtext: RichTextEdit,
	text: 'text',
	media: MediaEdit,
	link: LinkEdit,
};

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

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );
	const blockInformation = useBlockDisplayInformation( clientId );

	// Prepare fields for DataForm with defaults
	const dataFormFields = useMemo( () => {
		if ( ! blockType?.fields?.length ) {
			return [];
		}

		return blockType.fields.map( ( field ) => {
			// Provide default getValue if not specified
			const getValue =
				field.getValue ||
				( ( { item } ) => {
					// Simple case: id maps directly to attribute
					if ( ! field.mapping ) {
						return item[ field.id ] ?? '';
					}
					// Complex case: mapping multiple attributes
					const result = {};
					for ( const [ key, attrName ] of Object.entries(
						field.mapping
					) ) {
						result[ key ] = item[ attrName ] ?? '';
					}
					return result;
				} );

			// Provide default setValue if not specified
			const setValue =
				field.setValue ||
				( ( { value } ) => {
					// Simple case: id maps directly to attribute
					if ( ! field.mapping ) {
						return { [ field.id ]: value };
					}
					// Complex case: mapping multiple attributes
					const result = {};
					for ( const [ key, attrName ] of Object.entries(
						field.mapping
					) ) {
						result[ attrName ] = value[ key ];
					}
					return result;
				} );

			// Resolve Edit component - handle both component and config object formats
			let Edit;
			let editConfig = {};
			if ( field.Edit ) {
				if ( typeof field.Edit === 'object' && ! field.Edit.$$typeof ) {
					// Edit is a config object like { control: 'media', ... }
					editConfig = field.Edit;
					const controlName = editConfig.control;
					Edit = fieldTypeToEditComponent[ controlName ];
				} else {
					// Edit is already a component or string
					Edit = field.Edit;
				}
			} else {
				// Fall back to type-based lookup
				Edit = fieldTypeToEditComponent[ field.type ];
			}

			// Convert boolean isVisible to function for DataForm compatibility
			let isVisible = field.isVisible;
			if ( typeof isVisible !== 'function' ) {
				isVisible = isVisible !== false ? () => true : () => false;
			}

			return {
				...field,
				...editConfig, // Spread edit config properties so component receives them
				getValue,
				setValue,
				Edit,
				isVisible,
			};
		} );
	}, [ blockType?.fields ] );

	if ( ! blockType?.fields?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no fields.
		// for example, a way to select the block.
		return null;
	}

	return (
		<div className="block-editor-content-only-controls__block-fields">
			<div className="block-editor-content-only-controls__block-header">
				<HStack spacing={ 1 }>
					<BlockIcon icon={ blockInformation?.icon } />
					<div>{ blockTitle }</div>
				</HStack>
			</div>

			<DataForm
				data={ attributes }
				fields={ dataFormFields }
				form={ {
					layout: 'regular',
					fields: dataFormFields
						.filter( ( f ) => f.isVisible !== false )
						.map( ( f ) => f.id ),
				} }
				onChange={ ( updates ) =>
					updateBlockAttributes( clientId, updates )
				}
			/>
		</div>
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
