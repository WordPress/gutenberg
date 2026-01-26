/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	getBlockBindingsSource,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	__experimentalItem as Item,
	__experimentalText as Text,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalVStack as VStack,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';
import BlockBindingsSourceFieldsList from './source-fields-list';
import useBlockBindingsUtils from './use-block-bindings-utils';
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

const { Menu } = unlock( componentsPrivateApis );

export default function BlockBindingsAttributeControl( props ) {
	const { attribute, binding } = props;
	const { updateBlockBindings } = useBlockBindingsUtils();
	const { canUpdateBlockBindings } = useSelect( ( select ) => ( {
		canUpdateBlockBindings:
			select( blockEditorStore ).getSettings().canUpdateBlockBindings,
	} ) );

	return (
		<ToolsPanelItem
			hasValue={ () => !! binding }
			label={ attribute }
			onDeselect={ () => {
				if ( !! binding ) {
					updateBlockBindings( {
						[ attribute ]: undefined,
					} );
				}
			} }
		>
			<AttributeBindingMenu
				{ ...props }
				isWritable={ canUpdateBlockBindings }
			/>
		</ToolsPanelItem>
	);
}

function AttributeBindingMenu( { attribute, binding, blockName, isWritable } ) {
	const isMobile = useViewportMatch( 'medium', '<' );
	const blockContext = useContext( BlockContext );
	const {
		attributeType,
		getAllSources,
		getSourceFieldsList,
		hasCompatibleFields,
	} = useSelect(
		( select ) => {
			const {
				getAllBlockBindingsSources,
				getBlockBindingsSourceFieldsList,
				getBlockType,
			} = unlock( select( blocksStore ) );

			let _attributeType =
				getBlockType( blockName ).attributes?.[ attribute ]?.type;
			if ( _attributeType === 'rich-text' ) {
				_attributeType = 'string';
			}

			const allSources = getAllBlockBindingsSources();
			const sourceNames = Object.keys( allSources );
			const allCompatibleFieldKeys = sourceNames.reduce(
				( compatibleFieldKeys, sourceName ) => {
					const fieldsList = getBlockBindingsSourceFieldsList(
						allSources[ sourceName ],
						blockContext
					);
					for ( const field of fieldsList ) {
						if ( field.type === _attributeType ) {
							compatibleFieldKeys.push( field.args.key );
						}
					}
					return compatibleFieldKeys;
				},
				[]
			);
			return {
				attributeType: _attributeType,
				getAllSources: getAllBlockBindingsSources,
				getSourceFieldsList: getBlockBindingsSourceFieldsList,
				hasCompatibleFields: allCompatibleFieldKeys.length > 0,
				// Trigger a re-render when sources/fields change.
				invalidationKey:
					allCompatibleFieldKeys.join( '' ) + sourceNames.join( '' ),
			};
		},
		[ attribute, blockName, blockContext ]
	);

	const compatibleFields = hasCompatibleFields
		? Object.entries( getAllSources() ).reduce(
				( sourceFields, [ sourceName, source ] ) => {
					const fieldsList = getSourceFieldsList(
						source,
						blockContext
					);
					if ( ! fieldsList?.length ) {
						return sourceFields;
					}
					const compatibleFieldsList = fieldsList.filter(
						( field ) => field.type === attributeType
					);
					if ( compatibleFieldsList.length ) {
						sourceFields[ sourceName ] = compatibleFieldsList;
					}
					return sourceFields;
				},
				{}
		  )
		: {};

	// Keep UI enabled only when there are fields to connect to.
	isWritable &&= hasCompatibleFields;

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
			compatibleFields[ boundSourceName ]?.find( ( field ) =>
				fastDeepEqual( field.args, args )
			)?.label ||
			source?.label ||
			boundSourceName;
	}

	return (
		<Menu placement={ isMobile ? 'bottom-start' : 'left-start' }>
			<Menu.TriggerButton
				render={ <Item /> }
				disabled={ ! hasCompatibleFields }
			>
				<VStack className="block-editor-bindings__item" spacing={ 0 }>
					<Text truncate>{ attribute }</Text>
					<Text
						truncate
						variant={ isValid ? 'muted' : undefined }
						isDestructive={ ! isValid }
					>
						{ displayText }
					</Text>
				</VStack>
			</Menu.TriggerButton>
			<Menu.Popover gutter={ isMobile ? 8 : 36 }>
				{ isWritable && (
					<Menu
						placement={ isMobile ? 'bottom-start' : 'left-start' }
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
					</Menu>
				) }
			</Menu.Popover>
		</Menu>
	);
}
