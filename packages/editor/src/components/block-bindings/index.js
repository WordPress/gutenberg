/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	BlockControls,
	updateBlockBindingsAttribute,
} from '@wordpress/block-editor';
import { Button, MenuItem, MenuGroup, Popover } from '@wordpress/components';
import {
	plugins as pluginsIcon,
	chevronDown,
	chevronUp,
} from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import MetadataSourceUI from './metadata.js';

const blockBindingsWhitelist = {
	'core/paragraph': [ 'content' ],
	'core/heading': [ 'content' ],
	'core/image': [ 'url', 'title' ],
	'core/button': [ 'url', 'text' ],
};

export default function BlockBindingsButton( props ) {
	const { setAttributes } = props;

	const [ addingBinding, setAddingBinding ] = useState( false );
	// TODO: Triage why it is reloading after selecting a binding.
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
				<AttributesLayer { ...props } />
			</Popover>
		);
	}

	function AttributesLayer( props ) {
		const [ activeAttribute, setIsActiveAttribute ] = useState( false );
		return (
			<MenuGroup>
				{ blockBindingsWhitelist[ props.name ].map( ( attribute ) => (
					<div
						key={ attribute }
						className="block-bindings-attribute-picker-container"
					>
						<MenuItem
							icon={
								activeAttribute === attribute
									? chevronUp
									: chevronDown
							}
							isSelected={ activeAttribute === attribute }
							onClick={ () =>
								setIsActiveAttribute(
									activeAttribute === attribute
										? false
										: attribute
								)
							}
							className="block-bindings-attribute-picker-button"
						>
							{ attribute }
						</MenuItem>
						{ activeAttribute === attribute && (
							<>
								{ /* TODO: This component could potentially be defined by each source. */ }
								<MetadataSourceUI
									{ ...props }
									currentAttribute={ attribute }
									setIsActiveAttribute={
										setIsActiveAttribute
									}
								/>
								<RemoveBindingButton
									{ ...props }
									currentAttribute={ attribute }
									setIsActiveAttribute={
										setIsActiveAttribute
									}
								/>
							</>
						) }
					</div>
				) ) }
			</MenuGroup>
		);
	}

	function RemoveBindingButton( props ) {
		return (
			<Button
				className="block-bindings-remove-button"
				onClick={ () => {
					if ( ! props.attributes?.metadata.bindings ) {
						return;
					}

					const { currentAttribute } = props;
					// Modify the attribute we are binding.
					const newAttributes = {};
					newAttributes[ currentAttribute ] = '';
					setAttributes( newAttributes );

					// Update the bindings property.
					updateBlockBindingsAttribute(
						props.attributes,
						setAttributes,
						currentAttribute,
						null
					);
				} }
			>
				Remove binding
			</Button>
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

// TODO: Review if this is needed for other sources or just the metadata.
if ( window.__experimentalConnections ) {
	addFilter(
		'blocks.registerBlockType',
		'block-directory/fallback',
		( settings, name ) => {
			if ( ! ( name in blockBindingsWhitelist ) ) {
				return settings;
			}

			// TODO: Review the implications of this and the code.
			// Add the necessary context to the block.
			const contextItems = [ 'postId', 'postType', 'queryId' ];
			const usesContextArray = settings.usesContext;
			const oldUsesContextArray = new Set( usesContextArray );
			contextItems.forEach( ( item ) => {
				if ( ! oldUsesContextArray.has( item ) ) {
					usesContextArray.push( item );
				}
			} );
			settings.usesContext = usesContextArray;

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
