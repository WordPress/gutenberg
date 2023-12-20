/**
 * WordPress dependencies
 */
import { useState, cloneElement, Fragment } from '@wordpress/element';
import {
	BlockControls,
	updateBlockBindingsAttribute,
} from '@wordpress/block-editor';
import {
	Button,
	createSlotFill,
	MenuItem,
	MenuGroup,
	Popover,
} from '@wordpress/components';
import {
	plugins as pluginsIcon,
	chevronDown,
	chevronUp,
} from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import { BLOCK_BINDINGS_ALLOWED_BLOCKS } from '../../store/constants';

const { Slot, Fill } = createSlotFill( 'BlockBindingsUI' );

const BlockBindingsFill = ( { children, source, label } ) => {
	return (
		<Fill>
			{ ( props ) => {
				return (
					<>
						{ cloneElement( children, {
							source,
							label,
							...props,
						} ) }
					</>
				);
			} }
		</Fill>
	);
};

export default BlockBindingsFill;

const BlockBindingsUI = ( props ) => {
	const [ addingBinding, setAddingBinding ] = useState( false );
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
				{ addingBinding && (
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
						<AttributesLayer
							{ ...props }
							setAddingBinding={ setAddingBinding }
						/>
					</Popover>
				) }
			</BlockControls>
		</>
	);
};

function AttributesLayer( props ) {
	const [ activeAttribute, setIsActiveAttribute ] = useState( false );
	const [ activeSource, setIsActiveSource ] = useState( false );
	return (
		<MenuGroup>
			{ BLOCK_BINDINGS_ALLOWED_BLOCKS[ props.name ].map(
				( attribute ) => (
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
								<MenuGroup>
									{ /* Sources can fill this slot */ }
									<Slot
										fillProps={ {
											...props,
											currentAttribute: attribute,
											setIsActiveAttribute,
										} }
									>
										{ ( fills ) => {
											if ( ! fills.length ) {
												return null;
											}

											return (
												<>
													{ fills.map(
														( fill, index ) => {
															// TODO: Check better way to get the source and label.
															const source =
																fill[ 0 ].props
																	.children
																	.props
																	.source;
															const sourceLabel =
																fill[ 0 ].props
																	.children
																	.props
																	.label;
															const isSourceSelected =
																activeSource ===
																source;

															return (
																<Fragment
																	key={
																		index
																	}
																>
																	<MenuItem
																		icon={
																			isSourceSelected
																				? chevronUp
																				: chevronDown
																		}
																		isSelected={
																			isSourceSelected
																		}
																		onClick={ () =>
																			setIsActiveSource(
																				isSourceSelected
																					? false
																					: source
																			)
																		}
																		className="block-bindings-source-picker-button"
																	>
																		{
																			sourceLabel
																		}
																	</MenuItem>
																	{ isSourceSelected &&
																		fill }
																</Fragment>
															);
														}
													) }
												</>
											);
										} }
									</Slot>
								</MenuGroup>
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
				)
			) }
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

				const {
					currentAttribute,
					attributes,
					setAttributes,
					setAddingBinding,
				} = props;
				// Modify the attribute we are binding.
				const newAttributes = {};
				newAttributes[ currentAttribute ] = '';
				props.setAttributes( newAttributes );

				updateBlockBindingsAttribute(
					attributes,
					setAttributes,
					currentAttribute,
					null
				);

				setAddingBinding( false );
			} }
		>
			Remove binding
		</Button>
	);
}

if ( window.__experimentalBlockBindings ) {
	addFilter(
		'blocks.registerBlockType',
		'core/block-bindings-ui',
		( settings, name ) => {
			if ( ! ( name in BLOCK_BINDINGS_ALLOWED_BLOCKS ) ) {
				return settings;
			}

			// Add bindings button to the block toolbar.
			const OriginalComponent = settings.edit;
			settings.edit = ( props ) => {
				return (
					<>
						<OriginalComponent { ...props } />
						<BlockBindingsUI { ...props } />
					</>
				);
			};

			return settings;
		}
	);
}

// TODO: Add also some components to the sidebar.
