/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { BlockControls } from '@wordpress/block-editor';
import { Button, Popover } from '@wordpress/components';
import { plugins as pluginsIcon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import MetadataSourceUI from './metadata.js';

const blockBindingsWhitelist = {
	'core/paragraph': [ 'content' ],
	'core/image': [ 'url', 'title' ],
};

export default function BlockBindingsButton( props ) {
	const { setAttributes } = props;

	const [ addingBinding, setAddingBinding ] = useState( false );
	function BindingsUI() {
		return (
			<Popover
				popoverAnchor={ popoverAnchor }
				onClose={ () => {
					setAddingBinding( false );
				} }
				onFocusOutside={ () => {
					setAddingBinding( false );
				} }
				placement="bottom"
				shift
				className="block-bindings-ui-popover"
				{ ...props }
			>
				{ /* TODO: Add logic to select the attribute to bind */ }

				{ /* TODO: This component could potentially be defined by each source. */ }
				<MetadataSourceUI
					{ ...props }
					setAddingBinding={ setAddingBinding }
				/>

				{ /*
                        TODO: Add a better way to "clear" the binding.
                        We don't have to remove the whole bindings attribute but just the one we are binding.
                        We can explore if we can get back to the previous content or keep the value of the custom field.
                    */ }
				<button
					className="block-bindings-clear-button"
					onClick={ () => {
						if ( props.attributes.bindings ) {
							setAttributes( {
								content: '',
								url: '',
								bindings: {},
							} );
						}
						setAddingBinding( false );
					} }
				>
					Clear bindings
				</button>
			</Popover>
		);
	}

	const [ popoverAnchor, setPopoverAnchor ] = useState();
	return (
		<>
			<BlockControls group="other">
				<Button
					onClick={ () => {
						setAddingBinding( ! addingBinding );
					} }
					aria-expanded={ true }
					icon={ pluginsIcon }
					ref={ setPopoverAnchor }
				></Button>
				{ addingBinding && <BindingsUI /> }
			</BlockControls>
		</>
	);
}

if ( window.__experimentalConnections ) {
	addFilter(
		'blocks.registerBlockType',
		'block-directory/fallback',
		( settings, name ) => {
			if ( ! ( name in blockBindingsWhitelist ) ) {
				return settings;
			}

			// Add "bindings" attribute.
			if ( ! settings.attributes.bindings ) {
				settings.attributes.bindings = {
					type: 'object',
				};
			}

			// Add bindings button to the block toolbar.
			const OriginalComponent = settings.edit;
			settings.edit = ( props ) => {
				return (
					<>
						<OriginalComponent { ...props } />
						<BlockBindingsButton { ...props } />
					</>
				);
			};

			return settings;
		}
	);
}

// TODO: Add also some components to the sidebar.
