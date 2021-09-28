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
	TextControl,
	ToggleControl,
	ToolbarGroup,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { grid, list, edit, rss } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

const DEFAULT_MIN_ITEMS = 1;
const DEFAULT_MAX_ITEMS = 10;

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
			setIsEditing( false );
		}
	}

	const blockProps = useBlockProps();

	if ( isEditing ) {
		return (
			<div { ...blockProps }>
				<Placeholder icon={ rss } label="RSS">
					<form
						onSubmit={ onSubmitURL }
						className="wp-block-rss__placeholder-form"
					>
						<TextControl
							placeholder={ __( 'Enter URL here…' ) }
							value={ feedURL }
							onChange={ ( value ) =>
								setAttributes( { feedURL: value } )
							}
							className="wp-block-rss__placeholder-input"
						/>
						<Button variant="primary" type="submit">
							{ __( 'Use URL' ) }
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
			title: __( 'List view' ),
			onClick: () => setAttributes( { blockLayout: 'list' } ),
			isActive: blockLayout === 'list',
		},
		{
			icon: grid,
			title: __( 'Grid view' ),
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
				<PanelBody title={ __( 'RSS settings' ) }>
					<RangeControl
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
						label={ __( 'Display author' ) }
						checked={ displayAuthor }
						onChange={ toggleAttribute( 'displayAuthor' ) }
					/>
					<ToggleControl
						label={ __( 'Display date' ) }
						checked={ displayDate }
						onChange={ toggleAttribute( 'displayDate' ) }
					/>
					<ToggleControl
						label={ __( 'Display excerpt' ) }
						checked={ displayExcerpt }
						onChange={ toggleAttribute( 'displayExcerpt' ) }
					/>
					{ displayExcerpt && (
						<RangeControl
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
