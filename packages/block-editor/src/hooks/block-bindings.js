/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';
import {
	BaseControl,
	PanelBody,
	__experimentalHStack as HStack,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { canBindAttribute } from '../hooks/use-bindings-attributes';
import { unlock } from '../lock-unlock';
import InspectorControls from '../components/inspector-controls';

export const BlockBindingsPanel = ( { name, metadata } ) => {
	const { bindings } = metadata || {};
	const { sources } = useSelect( ( select ) => {
		const _sources = unlock(
			select( blocksStore )
		).getAllBlockBindingsSources();

		return {
			sources: _sources,
		};
	}, [] );

	if ( ! bindings ) {
		return null;
	}

	// Don't show not allowed attributes.
	// Don't show the bindings connected to pattern overrides in the inspectors panel.
	// TODO: Explore if this should be abstracted to let other sources decide.
	const filteredBindings = { ...bindings };
	Object.keys( filteredBindings ).forEach( ( key ) => {
		if (
			! canBindAttribute( name, key ) ||
			filteredBindings[ key ].source === 'core/pattern-overrides'
		) {
			delete filteredBindings[ key ];
		}
	} );

	if ( Object.keys( filteredBindings ).length === 0 ) {
		return null;
	}

	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Attributes' ) }
				className="components-panel__block-bindings-panel"
			>
				<BaseControl
					help={ __( 'Attributes connected to various sources.' ) }
				>
					<ItemGroup isBordered isSeparated size="large">
						{ Object.keys( filteredBindings ).map( ( key ) => {
							return (
								<Item key={ key }>
									<HStack>
										<span>{ key }</span>
										<span className="components-item__block-bindings-source">
											{ sources[
												filteredBindings[ key ].source
											]
												? sources[
														filteredBindings[ key ]
															.source
												  ].label
												: filteredBindings[ key ]
														.source }
										</span>
									</HStack>
								</Item>
							);
						} ) }
					</ItemGroup>
				</BaseControl>
			</PanelBody>
		</InspectorControls>
	);
};

export default {
	edit: BlockBindingsPanel,
	attributeKeys: [ 'metadata' ],
	hasSupport() {
		return true;
	},
};
