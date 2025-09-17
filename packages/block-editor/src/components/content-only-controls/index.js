/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	Button,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	__experimentalHStack as HStack,
	__experimentalGrid as Grid,
	TextControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';
import { lineSolid, update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import useBlockDisplayInformation from '../use-block-display-information';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';

const controls = {
	RichText( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		const valueKey = control.mapping.value;
		const value = attributeValues[ valueKey ];
		const defaultValue =
			blockType.attributes[ valueKey ]?.defaultValue ?? undefined;

		return (
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => value !== defaultValue }
				onDeselect={ () => {
					updateAttributes( { [ valueKey ]: defaultValue } );
				} }
				isShownByDefault={ control.shownByDefault }
			>
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ control.label }
					value={ value ? stripHTML( value ) : '' }
					onChange={ ( newValue ) => {
						updateAttributes( { [ valueKey ]: newValue } );
					} }
					autoComplete="off"
				/>
			</ToolsPanelItem>
		);
	},
	Media( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		const idKey = control.mapping.id;
		const srcKey = control.mapping.src;
		const captionKey = control.mapping.caption;
		const altKey = control.mapping.alt;

		const src = attributeValues[ srcKey ];
		const caption = attributeValues[ captionKey ];
		const alt = attributeValues[ altKey ];

		const idDefaultValue =
			blockType.attributes[ idKey ]?.defaultValue ?? undefined;
		const srcDefaultValue =
			blockType.attributes[ srcKey ]?.defaultValue ?? undefined;
		const captionDefaultValue =
			blockType.attributes[ captionKey ]?.defaultValue ?? undefined;
		const altDefaultValue =
			blockType.attributes[ altKey ]?.defaultValue ?? undefined;

		// TODO - pluralize.
		let chooseItemLabel;
		if ( control.args.allowedTypes.length === 1 ) {
			const allowedType = control.args.allowedTypes[ 0 ];
			if ( allowedType === 'image' ) {
				chooseItemLabel = __( 'Choose image' );
			} else if ( allowedType === 'video' ) {
				chooseItemLabel = __( 'Choose video' );
			} else if ( allowedType === 'application' ) {
				chooseItemLabel = __( 'Choose file' );
			} else {
				chooseItemLabel = __( 'Choose media item' );
			}
		} else {
			chooseItemLabel = __( 'Choose media item' );
		}

		return (
			<MediaUploadCheck>
				<ToolsPanelItem
					panelId={ clientId }
					label={ control.label }
					hasValue={ () => !! src }
					onDeselect={ () => {
						updateAttributes( {
							[ idKey ]: idDefaultValue,
							[ srcKey ]: srcDefaultValue,
							[ captionKey ]: captionDefaultValue,
							[ altKey ]: altDefaultValue,
						} );
					} }
					isShownByDefault={ control.shownByDefault }
				>
					<MediaUpload
						onSelect={ ( selectedMedia ) => {
							if ( selectedMedia.id && selectedMedia.url ) {
								const optionalAttributes = {};

								if ( ! caption && selectedMedia.caption ) {
									optionalAttributes[ captionKey ] =
										selectedMedia.caption;
								}
								if ( ! alt && selectedMedia.alt ) {
									optionalAttributes[ altKey ] =
										selectedMedia.alt;
								}

								updateAttributes( {
									[ idKey ]: selectedMedia.id,
									[ srcKey ]: selectedMedia.url,
									...optionalAttributes,
								} );
							}
						} }
						allowedTypes={ control.args.allowedTypes }
						multiple={ control.args.multiple }
						render={ ( { open } ) => {
							return (
								<div
									role="button"
									tabIndex={ -1 }
									onClick={ () => {
										open();
									} }
									onKeyDown={ open }
								>
									<Grid
										rowGap={ 0 }
										columnGap={ 8 }
										templateColumns="24px 1fr 24px"
									>
										{ src && (
											<>
												<img
													className="block-editor-content-only-controls__media-preview"
													alt=""
													width={ 24 }
													height={ 24 }
													src={ src }
												/>
												<span className="block-editor-content-only-controls__media-title">
													{
														// TODO - use media title instead of src.
														src
													}
												</span>
											</>
										) }
										{ ! src && (
											<>
												<span
													className="block-editor-content-only-controls__media-placeholder"
													style={ {
														width: '24px',
														height: '24px',
													} }
												/>
												<span className="block-editor-content-only-controls__media-title">
													{ chooseItemLabel }
												</span>
											</>
										) }
										{ src && (
											<>
												<Button
													size="small"
													className="block-editor-content-only-controls__remove-button"
													icon={ lineSolid }
													onClick={ ( event ) => {
														event.stopPropagation();
														updateAttributes( {
															[ idKey ]:
																idDefaultValue,
															[ srcKey ]:
																srcDefaultValue,
															[ captionKey ]:
																captionDefaultValue,
															[ altKey ]:
																altDefaultValue,
														} );
													} }
												/>
											</>
										) }
									</Grid>
								</div>
							);
						} }
					/>
				</ToolsPanelItem>
			</MediaUploadCheck>
		);
	},
	Link( {
		clientId,
		control,
		blockType,
		attributeValues,
		updateAttributes,
	} ) {
		return (
			<ToolsPanelItem
				panelId={ clientId }
				label={ control.label }
				hasValue={ () => false } // TODO.
				onDeselect={ () => {
					// TODO.
				} }
				isShownByDefault={ control.shownByDefault }
			>
				Link
			</ToolsPanelItem>
		);
	},
};

function BlockAttributeToolsPanelItem( {
	clientId,
	control,
	blockType,
	attributeValues,
} ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const ControlComponent = controls[ control.type ];

	if ( ! ControlComponent ) {
		return null;
	}

	return (
		<ControlComponent
			clientId={ clientId }
			control={ control }
			blockType={ blockType }
			attributeValues={ attributeValues }
			updateAttributes={ ( attributes ) =>
				updateBlockAttributes( clientId, attributes )
			}
		/>
	);
}

function BlockControls( { clientId } ) {
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

	if ( ! blockType?.controls?.length ) {
		// TODO - we might still want to show a placeholder for blocks with no controls.
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
		>
			{ blockType?.controls?.map( ( control, index ) => (
				<BlockAttributeToolsPanelItem
					key={ `${ clientId }/${ index }` }
					clientId={ clientId }
					control={ control }
					blockType={ blockType }
					attributeValues={ attributes }
				/>
			) ) }
		</ToolsPanel>
	);
}

export default function ContentOnlyControls( { clientIds } ) {
	if ( ! clientIds.length ) {
		return null;
	}

	return clientIds.map( ( clientId ) => (
		<BlockControls key={ clientId } clientId={ clientId } />
	) );
}
