/**
 * External dependencies
 */
import { forEach } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
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
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const DEFAULT_AVATAR_SIZE = 24;

function PostAuthorEdit( {
	isSelected,
	fontSize,
	setFontSize,
	context,
	attributes,
	setAttributes,
} ) {
	const { postType, postId } = context;

	const { authorId, authorDetails, authors } = useSelect( ( select ) => {
		const { getEditedEntityRecord, getUser, getAuthors } = select( 'core' );
		const { author: _authorId } = getEditedEntityRecord(
			'postType',
			postType,
			postId
		);

		return {
			authorId: _authorId,
			authorDetails: _authorId ? getUser( _authorId ) : null,
			authors: getAuthors(),
		};
	} );

	const { editEntityRecord } = useDispatch( 'core' );

	const ref = useRef();
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

	const { align, showAvatar, showBio, byline } = attributes;

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
	if ( !! attributes.avatarSize ) {
		avatarSize = attributes.avatarSize;
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
						value={ authorId }
						options={ authors.map( ( { id, name } ) => {
							return {
								value: id,
								label: name,
							};
						} ) }
						onChange={ ( nextAuthorId ) => {
							editEntityRecord( 'postType', postType, postId, {
								author: nextAuthorId,
							} );
						} }
					/>
					<ToggleControl
						label={ __( 'Show avatar' ) }
						checked={ showAvatar }
						onChange={ () =>
							setAttributes( { showAvatar: ! showAvatar } )
						}
					/>
					{ showAvatar && (
						<SelectControl
							label={ __( 'Avatar size' ) }
							value={ attributes.avatarSize }
							options={ avatarSizes }
							onChange={ ( size ) => {
								setAttributes( {
									avatarSize: Number( size ),
								} );
							} }
						/>
					) }
					<ToggleControl
						label={ __( 'Show bio' ) }
						checked={ showBio }
						onChange={ () =>
							setAttributes( { showBio: ! showBio } )
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
						setAttributes( { align: nextAlign } );
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
										setAttributes( { byline: value } )
									}
								/>
							) }
							<p className="wp-block-post-author__name">
								{ authorDetails?.name }
							</p>
							{ showBio && (
								<p className={ 'wp-block-post-author__bio' }>
									{ authorDetails?.description }
								</p>
							) }
						</div>
					</div>
				</BackgroundColor>
			</TextColor>
		</>
	);
}

export default withFontSizes( 'fontSize' )( PostAuthorEdit );
