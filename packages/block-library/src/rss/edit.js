/**
 * WordPress dependencies
 */
import {
	BlockControls,
	InspectorControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	Button,
	Disabled,
	Placeholder,
	RangeControl,
	ToggleControl,
	ToolbarGroup,
	TextControl,
	ExternalLink,
	__experimentalInputControl as InputControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { grid, list, pencil, rss } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { prependHTTP } from '@wordpress/url';
import ServerSideRender from '@wordpress/server-side-render';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 20;

export default function RSSEdit( { attributes, setAttributes } ) {
	const [ isEditing, setIsEditing ] = useState( ! attributes.feedURL );

	const {
		blockLayout,
		columns,
		displayAuthor,
		displayDate,
		displayExcerpt,
		excerptLength,
		feedURL,
		itemsToShow,
		openInNewTab,
		rel,
	} = attributes;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	function toggleAttribute( propName ) {
		return () => {
			const value = attributes[ propName ];

			setAttributes( { [ propName ]: ! value } );
		};
	}

	function onSubmitURL( event ) {
		event.preventDefault();

		if ( feedURL ) {
			setAttributes( { feedURL: prependHTTP( feedURL ) } );
			setIsEditing( false );
		}
	}

	const blockProps = useBlockProps();

	const label = __( 'RSS URL' );

	if ( isEditing ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ rss }
					label={ label }
					instructions={ __(
						'Display entries from any RSS or Atom feed.'
					) }
				>
					<form
						onSubmit={ onSubmitURL }
						className="wp-block-rss__placeholder-form"
					>
						<InputControl
							__next40pxDefaultSize
							label={ label }
							type="url"
							hideLabelFromVision
							placeholder={ __( 'Enter URL here…' ) }
							value={ feedURL }
							onChange={ ( value ) =>
								setAttributes( { feedURL: value } )
							}
							className="wp-block-rss__placeholder-input"
						/>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
						>
							{ __( 'Apply' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	const toolbarControls = [
		{
			icon: pencil,
			title: __( 'Edit RSS URL' ),
			onClick: () => setIsEditing( true ),
		},
		{
			icon: list,
			title: _x( 'List view', 'RSS block display setting' ),
			onClick: () => setAttributes( { blockLayout: 'list' } ),
			isActive: blockLayout === 'list',
		},
		{
			icon: grid,
			title: _x( 'Grid view', 'RSS block display setting' ),
			onClick: () => setAttributes( { blockLayout: 'grid' } ),
			isActive: blockLayout === 'grid',
		},
	];

	/*
	 * This function merges the existing attributes with additional style properties.
	 * The `border` and `spacing` properties are set to `undefined` to ensure that
	 * these styles are reset and not applied on the server side.
	 */
	const serverSideAttributes = {
		...attributes,
		style: {
			...attributes?.style,
			border: undefined,
			spacing: undefined,
		},
	};
	return (
		<>
			<BlockControls>
				<ToolbarGroup controls={ toolbarControls } />
			</BlockControls>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							itemsToShow: 5,
							displayAuthor: false,
							displayDate: false,
							displayExcerpt: false,
							excerptLength: 55,
							columns: 2,
							openInNewTab: false,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Number of items' ) }
						hasValue={ () => itemsToShow !== 5 }
						onDeselect={ () => setAttributes( { itemsToShow: 5 } ) }
						isShownByDefault
					>
						<RangeControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Number of items' ) }
							value={ itemsToShow }
							onChange={ ( value ) =>
								setAttributes( { itemsToShow: value } )
							}
							min={ DEFAULT_MIN_ITEMS }
							max={ DEFAULT_MAX_ITEMS }
							required
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						label={ __( 'Display author' ) }
						hasValue={ () => !! displayAuthor }
						onDeselect={ () =>
							setAttributes( { displayAuthor: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display author' ) }
							checked={ displayAuthor }
							onChange={ toggleAttribute( 'displayAuthor' ) }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						label={ __( 'Display date' ) }
						hasValue={ () => !! displayDate }
						onDeselect={ () =>
							setAttributes( { displayDate: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display date' ) }
							checked={ displayDate }
							onChange={ toggleAttribute( 'displayDate' ) }
						/>
					</ToolsPanelItem>

					<ToolsPanelItem
						label={ __( 'Display excerpt' ) }
						hasValue={ () => !! displayExcerpt }
						onDeselect={ () =>
							setAttributes( { displayExcerpt: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Display excerpt' ) }
							checked={ displayExcerpt }
							onChange={ toggleAttribute( 'displayExcerpt' ) }
						/>
					</ToolsPanelItem>

					{ displayExcerpt && (
						<ToolsPanelItem
							label={ __( 'Max number of words in excerpt' ) }
							hasValue={ () => excerptLength !== 55 }
							onDeselect={ () =>
								setAttributes( { excerptLength: 55 } )
							}
							isShownByDefault
						>
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Max number of words in excerpt' ) }
								value={ excerptLength }
								onChange={ ( value ) =>
									setAttributes( { excerptLength: value } )
								}
								min={ 10 }
								max={ 100 }
								required
							/>
						</ToolsPanelItem>
					) }

					{ blockLayout === 'grid' && (
						<ToolsPanelItem
							label={ __( 'Columns' ) }
							hasValue={ () => columns !== 2 }
							onDeselect={ () => setAttributes( { columns: 2 } ) }
							isShownByDefault
						>
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Columns' ) }
								value={ columns }
								onChange={ ( value ) =>
									setAttributes( { columns: value } )
								}
								min={ 2 }
								max={ 6 }
								required
							/>
						</ToolsPanelItem>
					) }

					<ToolsPanelItem
						label={ __( 'Open links in new tab' ) }
						hasValue={ () => !! openInNewTab }
						onDeselect={ () =>
							setAttributes( { openInNewTab: false } )
						}
						isShownByDefault
					>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Open links in new tab' ) }
							checked={ openInNewTab }
							onChange={ ( value ) =>
								setAttributes( { openInNewTab: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__next40pxDefaultSize
					label={ __( 'Link relation' ) }
					help={ createInterpolateElement(
						__(
							'The <a>Link Relation</a> attribute defines the relationship between a linked resource and the current document.'
						),
						{
							a: (
								<ExternalLink href="https://developer.mozilla.org/docs/Web/HTML/Attributes/rel" />
							),
						}
					) }
					value={ rel || '' }
					onChange={ ( value ) => setAttributes( { rel: value } ) }
				/>
			</InspectorControls>
			<div { ...blockProps }>
				<Disabled>
					<ServerSideRender
						block="core/rss"
						attributes={ serverSideAttributes }
					/>
				</Disabled>
			</div>
		</>
	);
}
