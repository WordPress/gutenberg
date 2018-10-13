/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	IconButton,
	PanelBody,
	RangeControl,
	ToggleControl,
	Toolbar,
	withNotices,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import {
	AlignmentToolbar,
	BlockAlignmentToolbar,
	BlockControls,
	InspectorControls,
	MediaPlaceholder,
	MediaUpload,
	PanelColorSettings,
	RichText,
	withColors,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

const CoverImageEdit = ( { attributes, setAttributes, isSelected, className, noticeOperations, noticeUI, overlayColor, setOverlayColor } ) => {
	const { url, title, align, contentAlign, id, hasParallax, dimRatio } = attributes;
	const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
	const onSelectImage = ( media ) => {
		if ( ! media || ! media.url ) {
			setAttributes( { url: undefined, id: undefined } );
			return;
		}
		setAttributes( { url: media.url, id: media.id } );
	};
	const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
	const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );
	const setTitle = ( newTitle ) => setAttributes( { title: newTitle } );

	const style = {
		...backgroundImageStyles( url ),
		backgroundColor: overlayColor.color,
	};

	const classes = classnames(
		className,
		contentAlign !== 'center' && `has-${ contentAlign }-content`,
		dimRatioToClass( dimRatio ),
		{
			'has-background-dim': dimRatio !== 0,
			'has-parallax': hasParallax,
		}
	);

	const controls = (
		<Fragment>
			<BlockControls>
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>
				{ !! url && (
					<Fragment>
						<AlignmentToolbar
							value={ contentAlign }
							onChange={ ( nextAlign ) => {
								setAttributes( { contentAlign: nextAlign } );
							} }
						/>
						<Toolbar>
							<MediaUpload
								onSelect={ onSelectImage }
								allowedTypes={ ALLOWED_MEDIA_TYPES }
								value={ id }
								render={ ( { open } ) => (
									<IconButton
										className="components-toolbar__control"
										label={ __( 'Edit image' ) }
										icon="edit"
										onClick={ open }
									/>
								) }
							/>
						</Toolbar>
					</Fragment>
				) }
			</BlockControls>
			{ !! url && (
				<InspectorControls>
					<PanelBody title={ __( 'Cover Image Settings' ) }>
						<ToggleControl
							label={ __( 'Fixed Background' ) }
							checked={ hasParallax }
							onChange={ toggleParallax }
						/>
						<PanelColorSettings
							title={ __( 'Overlay' ) }
							initialOpen={ true }
							colorSettings={ [ {
								value: overlayColor.color,
								onChange: setOverlayColor,
								label: __( 'Overlay Color' ),
							} ] }
						>
							<RangeControl
								label={ __( 'Background Opacity' ) }
								value={ dimRatio }
								onChange={ setDimRatio }
								min={ 0 }
								max={ 100 }
								step={ 10 }
							/>
						</PanelColorSettings>
					</PanelBody>
				</InspectorControls>
			) }
		</Fragment>
	);

	if ( ! url ) {
		const hasTitle = ! RichText.isEmpty( title );
		const icon = hasTitle ? undefined : 'format-image';
		const label = hasTitle ? (
			<RichText
				tagName="h2"
				value={ title }
				onChange={ setTitle }
				inlineToolbar
			/>
		) : __( 'Cover Image' );

		return (
			<Fragment>
				{ controls }
				<MediaPlaceholder
					icon={ icon }
					className={ className }
					labels={ {
						title: label,
						name: __( 'an image' ),
					} }
					onSelect={ onSelectImage }
					accept="image/*"
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					notices={ noticeUI }
					onError={ noticeOperations.createErrorNotice }
				/>
			</Fragment>
		);
	}

	return (
		<Fragment>
			{ controls }
			<div
				data-url={ url }
				style={ style }
				className={ classes }
			>
				{ ( ! RichText.isEmpty( title ) || isSelected ) && (
					<RichText
						tagName="p"
						className="wp-block-cover-image-text"
						placeholder={ __( 'Write title…' ) }
						value={ title }
						onChange={ setTitle }
						inlineToolbar
					/>
				) }
			</div>
		</Fragment>
	);
};

export default compose( [
	withColors( { overlayColor: 'background-color' } ),
	withNotices,
] )( CoverImageEdit );

function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
