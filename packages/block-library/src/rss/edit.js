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
	PanelBody,
	Placeholder,
	RangeControl,
	ToggleControl,
	ToolbarGroup,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { grid, list, edit, rss } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { prependHTTP } from '@wordpress/url';
import ServerSideRender from '@wordpress/server-side-render';

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
	} = attributes;

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
			icon: edit,
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

	return (
		<>
			<BlockControls>
				<ToolbarGroup controls={ toolbarControls } />
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
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
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display author' ) }
						checked={ displayAuthor }
						onChange={ toggleAttribute( 'displayAuthor' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display date' ) }
						checked={ displayDate }
						onChange={ toggleAttribute( 'displayDate' ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Display excerpt' ) }
						checked={ displayExcerpt }
						onChange={ toggleAttribute( 'displayExcerpt' ) }
					/>
					{ displayExcerpt && (
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
					) }
					{ blockLayout === 'grid' && (
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
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<Disabled>
					<ServerSideRender
						block="core/rss"
						attributes={ attributes }
					/>
				</Disabled>
			</div>
		</>
	);
}
