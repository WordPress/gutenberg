/**
 * External dependencies
 */
import { forEach } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useState } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import {
	AlignmentToolbar,
	BlockControls,
	FontSizePicker,
	InspectorControls,
	RichText,
	__experimentalUseColors,
	BlockColorsStyleSelector,
	withFontSizes,
} from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const DEFAULT_AVATAR_SIZE = 24;

async function getAuthorDetails( authorId, setAuthorDetails ) {
	const authorDetails = await apiFetch( {
		path: '/wp/v2/users/' + authorId + '?context=edit',
	} );
	setAuthorDetails( authorDetails );
}

function PostAuthorDisplay( {
	postAuthor,
	setPostAuthor,
	authorDetails,
	setAuthorDetails,
	props,
} ) {
	const ref = useRef();

	const { authors } = useSelect( ( select ) => ( {
		authors: select( 'core' ).getAuthors(),
	} ) );

	const { isSelected, fontSize, setFontSize } = props;
	const {
		TextColor,
		BackgroundColor,
		InspectorControlsColorPanel,
		ColorPanel,
	} = __experimentalUseColors(
		[
			{ name: 'textColor', property: 'color' },
			{ name: 'backgroundColor', className: 'background-color' },
		],
		{
			contrastCheckers: [
				{
					backgroundColor: true,
					textColor: true,
					fontSize: fontSize.size,
				},
			],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ fontSize.size ]
	);

	const { align, showAvatar, showBio, byline } = props.attributes;

	const avatarSizes = [];
	if ( authorDetails ) {
		forEach( authorDetails.avatar_urls, ( url, size ) => {
			avatarSizes.push( {
				value: size,
				label: `${ size } x ${ size }`,
			} );
		} );
	}

	let avatarSize = DEFAULT_AVATAR_SIZE;
	if ( !! props.attributes.avatarSize ) {
		avatarSize = props.attributes.avatarSize;
	}

	const blockClassNames = classnames( 'wp-block-post-author', {
		[ fontSize.class ]: fontSize.class,
	} );
	const blockInlineStyles = {
		fontSize: fontSize.size ? fontSize.size + 'px' : undefined,
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Author Settings' ) }>
					<SelectControl
						label={ __( 'Author' ) }
						value={ postAuthor }
						options={ authors.map( ( { id, name } ) => {
							return {
								value: id,
								label: name,
							};
						} ) }
						onChange={ ( newAuthorId ) => {
							setPostAuthor( newAuthorId );
							getAuthorDetails( newAuthorId, setAuthorDetails );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () =>
							props.setAttributes( { showAvatar: ! showAvatar } )
						}
					/>
					{ showAvatar && (
						<SelectControl
							label={ __( 'Avatar size' ) }
							value={ props.attributes.avatarSize }
							options={ avatarSizes }
							onChange={ ( size ) => {
								props.setAttributes( {
									avatarSize: Number( size ),
								} );
							} }
						/>
					) }
					<ToggleControl
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () =>
							props.setAttributes( { showBio: ! showBio } )
						}
					/>
				</PanelBody>
				<PanelBody title={ __( 'Text settings' ) }>
					<FontSizePicker
						value={ fontSize.size }
						onChange={ setFontSize }
					/>
				</PanelBody>
			</InspectorControls>

			{ InspectorControlsColorPanel }

			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						props.setAttributes( { align: nextAlign } );
					} }
				/>
				<BlockColorsStyleSelector
					TextColor={ TextColor }
					BackgroundColor={ BackgroundColor }
				>
					{ ColorPanel }
				</BlockColorsStyleSelector>
			</BlockControls>

			<TextColor>
				<BackgroundColor>
					<div
						ref={ ref }
						className={ classnames( blockClassNames, {
							[ `has-text-align-${ align }` ]: align,
						} ) }
						style={ blockInlineStyles }
					>
						{ showAvatar && authorDetails && (
							<div className="wp-block-post-author__avatar">
								<img
									width={ avatarSize }
									src={
										authorDetails.avatar_urls[ avatarSize ]
									}
									alt={ authorDetails.name }
								/>
							</div>
						) }
						<div className="wp-block-post-author__content">
							{ ( ! RichText.isEmpty( byline ) ||
								isSelected ) && (
								<RichText
									className="wp-block-post-author__byline"
									multiline={ false }
									placeholder={ __( 'Write byline …' ) }
									withoutInteractiveFormatting
									allowedFormats={ [
										'core/bold',
										'core/italic',
										'core/strikethrough',
									] }
									value={ byline }
									onChange={ ( value ) =>
										props.setAttributes( { byline: value } )
									}
								/>
							) }
							<p className="wp-block-post-author__name">
								{ authorDetails.name }
							</p>
							{ showBio && (
								<p className={ 'wp-block-post-author__bio' }>
									{ authorDetails.description }
								</p>
							) }
						</div>
					</div>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

function PostAuthorEdit( props ) {
	const [ postAuthor, setPostAuthor ] = useEntityProp(
		'postType',
		'post',
		'author'
	);

	const [ authorDetails, setAuthorDetails ] = useState( false );

	if ( ! postAuthor ) {
		return 'Post Author Placeholder';
	}

	if ( ! authorDetails ) {
		getAuthorDetails( postAuthor, setAuthorDetails );
	}

	return (
		<PostAuthorDisplay
			postAuthor={ postAuthor }
			setPostAuthor={ setPostAuthor }
			authorDetails={ authorDetails }
			setAuthorDetails={ setAuthorDetails }
			props={ props }
		/>
	);
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
