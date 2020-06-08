/**
 * External dependencies
 */
import { forEach, groupBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useMemo } from '@wordpress/element';
import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	RichText,
	__experimentalUseColors,
	BlockColorsStyleSelector,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const DEFAULT_CONTRAST_CHECK_FONT_SIZE = 12;

function PostAuthorEdit( { isSelected, context, attributes, setAttributes } ) {
	const { postType, postId } = context;

	const { authorId, authorDetails, authors } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getUser, getAuthors } = select(
				'core'
			);
			const _authorId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.author;

			return {
				authorId: _authorId,
				authorDetails: _authorId ? getUser( _authorId ) : null,
				authors: getAuthors(),
			};
		},
		[ postType, postId ]
	);

	const { editEntityRecord } = useDispatch( 'core' );

	// Need font size in number form for named presets to be used in contrastCheckers.
	const { fontSizes } = useSelect( ( select ) =>
		select( 'core/block-editor' ).getSettings()
	);
	const fontSizeIndex = useMemo( () => groupBy( fontSizes, 'slug' ), [
		fontSizes,
	] );
	const contrastCheckFontSize = useMemo(
		() =>
			// Custom size if set.
			attributes.style?.typography?.fontSize ||
			// Size of preset/named value if set.
			fontSizeIndex[ attributes.fontSize ]?.[ 0 ].size ||
			DEFAULT_CONTRAST_CHECK_FONT_SIZE,
		[
			attributes.style?.typography?.fontSize,
			attributes.fontSize,
			fontSizeIndex,
		]
	);
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
					fontSize: contrastCheckFontSize,
				},
			],
			colorDetector: { targetRef: ref },
			colorPanelProps: {
				initialOpen: true,
			},
		},
		[ contrastCheckFontSize ]
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

	const classNames = useMemo( () => {
		return {
			block: classnames( 'wp-block-post-author', {
				[ `has-text-align-${ align }` ]: align,
			} ),
		};
	}, [ align ] );

	const inlineStyles = useMemo( () => {
		return {
			bio: { fontSize: attributes.bioRatio + 'em' },
			byline: { fontSize: attributes.bylineRatio + 'em' },
		};
	}, [ attributes.bioRatio, attributes.bylineRatio ] );

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
					<RangeControl
						label={ __( 'Relative byline size' ) }
						value={ attributes.bylineRatio }
						onChange={ ( ratio ) =>
							setAttributes( { bylineRatio: ratio } )
						}
						min={ 0.1 }
						max={ 1.5 }
						step={ 0.1 }
					/>
					<RangeControl
						label={ __( 'Relative bio size' ) }
						value={ attributes.bioRatio }
						onChange={ ( ratio ) =>
							setAttributes( { bioRatio: ratio } )
						}
						min={ 0.1 }
						max={ 1.5 }
						step={ 0.1 }
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
					<div ref={ ref } className={ classNames.block }>
						{ showAvatar && authorDetails && (
							<div className="wp-block-post-author__avatar">
								<img
									width={ attributes.avatarSize }
									src={
										authorDetails.avatar_urls[
											attributes.avatarSize
										]
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
									value={ byline }
									onChange={ ( value ) =>
										setAttributes( { byline: value } )
									}
									style={ inlineStyles.byline }
								/>
							) }
							<p className="wp-block-post-author__name">
								{ authorDetails?.name }
							</p>
							{ showBio && (
								<p
									className="wp-block-post-author__bio"
									style={ inlineStyles.bio }
								>
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

export default PostAuthorEdit;
