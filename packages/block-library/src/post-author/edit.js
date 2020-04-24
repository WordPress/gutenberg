/**
 * External dependencies
 */
import classnames from 'classnames';
import { invoke } from 'lodash';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useRef, useEffect, useState } from '@wordpress/element';
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

function PostAuthorDisplay( { props, postAuthorId } ) {
	const ref = useRef();

	const [ authorId, setAuthorId ] = useState( props.attributes.id );

	const { author, authors } = useSelect(
		( select ) => {
			const { getEntityRecord, getAuthors } = select( 'core' );
			return {
				author: getEntityRecord( 'root', 'user', postAuthorId ),
				authors: getAuthors(),
			};
		},
		[ postAuthorId ]
	);

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

	const { align, id, showAvatar, showBio, byline } = props.attributes;

	const avatarSizes = [
		{ value: 24, label: __( 'Small' ) },
		{ value: 48, label: __( 'Medium' ) },
		{ value: 96, label: __( 'Large' ) },
	];

	let avatarSize = DEFAULT_AVATAR_SIZE;
	if ( !! props.attributes.avatarSize ) {
		avatarSize = props.attributes.avatarSize;
	}
	useEffect( () => {
		if ( author && ! props.attributes.id ) {
			props.setAttributes( {
				id: Number( author.id ),
				name: author.name,
				description: author.description,
				avatarSize,
				avatarUrl: author.avatar_urls[ avatarSize ],
			} );
		} else if ( authorId ) {
			const authorFetch = apiFetch( {
				path: '/wp/v2/users/' + authorId + '?context=edit',
			} );
			authorFetch.then( ( newAuthor ) => {
				props.setAttributes( {
					id: newAuthor.id,
					name: newAuthor.name,
					avatarUrl:
						newAuthor.avatar_urls[ props.attributes.avatarSize ],
					description: newAuthor.description,
				} );
			} );
			return () => {
				if ( authorFetch ) {
					invoke( authorFetch, [ 'abort' ] );
				}
			};
		}
	}, [ authorId, author ] );

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
						value={ id }
						options={ authors.map( ( theAuthor ) => {
							return {
								value: theAuthor.id,
								label: theAuthor.name,
							};
						} ) }
						onChange={ ( newAuthorId ) => {
							setAuthorId( newAuthorId );
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
						{ showAvatar && (
							<div className="wp-block-post-author__avatar">
								<img
									width={ props.attributes.avatarSize }
									src={ props.attributes.avatarUrl }
									alt={ props.attributes.name }
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
								{ props.attributes.name }
							</p>
							{ showBio && (
								<p className={ 'wp-block-post-author__bio' }>
									{ props.attributes.description }
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
	const [ postAuthorId ] = useEntityProp( 'postType', 'post', 'author' );
	if ( ! postAuthorId ) {
		return 'Post Author Placeholder';
	}

	return <PostAuthorDisplay postAuthorId={ postAuthorId } props={ props } />;
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
