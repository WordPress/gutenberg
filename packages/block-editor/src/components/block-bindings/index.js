/**
 * WordPress dependencies
 */
import { addFilter, hasFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { hasBlockSupport } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { useBlockEditingMode } from '../../components/block-editing-mode';

export const AVAILABLE_BINDINGS = {
	'core/paragraph': 'content',
	'core/image': 'url',
};

export function useAvailableBlockBindings( name ) {
	return AVAILABLE_BINDINGS[ name ];
}

/**
 * Filters registered block settings, extending attributes to include `connections`.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( hasBlockSupport( settings, '__experimentalConnections', true ) ) {
		// Gracefully handle if settings.attributes.connections is undefined.
		settings.attributes = {
			...settings.attributes,
			connections: {
				type: 'object',
			},
		};
	}

	return settings;
}

const createBindingControls = ( Block ) =>
	createHigherOrderComponent( ( BlockEdit ) => {
		return ( props ) => {
			const blockEditingMode = useBlockEditingMode();
			if ( blockEditingMode !== 'default' ) {
				return null;
			}

			// Check if the current block is a paragraph or image block.
			// Currently, only these two blocks are supported.
			if ( ! [ 'core/paragraph', 'core/image' ].includes( props.name ) ) {
				return <BlockEdit key="edit" { ...props } />;
			}

			const hasConnectionsSupport = hasBlockSupport(
				props.name,
				'__experimentalConnections',
				false
			);

			return (
				<>
					<BlockEdit key="edit" { ...props } />
					{ hasConnectionsSupport && props.isSelected && (
						<Block { ...props } />
					) }
				</>
			);
		};
	}, 'withBindingControls' );

/**
 * Registers a new block binding.
 * @param {Object}   options
 * @param {string}   options.name The name of the binding.
 * @param {Function} options.edit Renders the bindings in the editor.
 * @return {void}
 */
export function registerBlockBinding( { name, edit } ) {
	if ( window.__experimentalConnections ) {
		addFilter(
			'editor.BlockEdit',
			`editor/connections/with-inspector-controls/${ name }`,
			createBindingControls( edit )
		);

		if (
			! hasFilter(
				'blocks.registerBlockType',
				'core/editor/connections/attribute'
			)
		) {
			addFilter(
				'blocks.registerBlockType',
				'core/editor/connections/attribute',
				addAttribute
			);
		}
	}
}
