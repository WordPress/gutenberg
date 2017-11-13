/**
 * WordPress dependencies
 */
import { Placeholder, Toolbar, Dashicon, IconButton, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import UrlInput from '../../url-input';
import ColorPalette from '../../color-palette';
import { registerBlockType, source } from '../../api';
import Editable from '../../editable';
import MediaUploadButton from '../../media-upload-button';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import RangeControl from '../../inspector-controls/range-control';
import BlockDescription from '../../block-description';

const { children } = source;

const validAlignments = [ 'left', 'center', 'right', 'wide', 'full' ];

registerBlockType( 'core/cover-image', {
	title: __( 'Cover Image' ),

	icon: 'format-image',

	category: 'common',

	attributes: {
		title: {
			type: 'array',
			source: children( 'h2' ),
		},
		url: {
			type: 'string',
		},
		align: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		hasParallax: {
			type: 'boolean',
			default: false,
		},
		dimRatio: {
			type: 'number',
			default: 50,
		},
		buttonBackgroundColor: {
			type: 'string',
		},
		buttonText: {
			type: 'string',
		},
		buttonTextColor: {
			type: 'string',
		},
		buttonUrl: {
			type: 'string',
		},
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( -1 !== validAlignments.indexOf( align ) ) {
			return { 'data-align': align };
		}
	},

	edit( { attributes, setAttributes, focus, setFocus, className } ) {
		const { url, title, align, id, hasParallax, dimRatio, buttonBackgroundColor, buttonText, buttonTextColor, buttonUrl } = attributes;
		const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );
		const onSelectImage = ( media ) => setAttributes( { url: media.url, id: media.id } );
		const toggleParallax = () => setAttributes( { hasParallax: ! hasParallax } );
		const toggleButton = () => setAttributes( { buttonText: buttonText === undefined ? '' : undefined } );
		const setDimRatio = ( ratio ) => setAttributes( { dimRatio: ratio } );
		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);
		let focusedEditable = focus ? focus.editable : null;
		if ( ! focusedEditable && buttonText === undefined ) {
			focusedEditable = 'title';
		}

		const controls = focus && [
			<BlockControls key="controls">
				<BlockAlignmentToolbar
					value={ align }
					onChange={ updateAlignment }
				/>

				<Toolbar>
					<MediaUploadButton
						buttonProps={ {
							className: 'components-icon-button components-toolbar__control',
							'aria-label': __( 'Edit image' ),
						} }
						onSelect={ onSelectImage }
						type="image"
						value={ id }
					>
						<Dashicon icon="edit" />
					</MediaUploadButton>
				</Toolbar>
			</BlockControls>,
			<InspectorControls key="inspector">
				<BlockDescription>
					<p>{ __( 'Cover Image is a bold image block with an optional title.' ) }</p>
				</BlockDescription>
				<h3>{ __( 'Cover Image Settings' ) }</h3>
				<ToggleControl
					label={ __( 'Fixed Background' ) }
					checked={ !! hasParallax }
					onChange={ toggleParallax }
				/>
				<RangeControl
					label={ __( 'Background Dimness' ) }
					value={ dimRatio }
					onChange={ setDimRatio }
					min={ 0 }
					max={ 100 }
					step={ 10 }
				/>
				<ToggleControl
					label={ __( 'Call to action' ) }
					checked={ buttonText !== undefined }
					onChange={ toggleButton }
				/>
			</InspectorControls>,
		];

		if ( ! url ) {
			const uploadButtonProps = { isLarge: true };
			return [
				controls,
				<Placeholder
					key="placeholder"
					instructions={ __( 'Drag image here or insert from media library' ) }
					icon="format-image"
					label={ __( 'Cover Image' ) }
					className={ className }>
					<MediaUploadButton
						buttonProps={ uploadButtonProps }
						onSelect={ onSelectImage }
						type="image"
					>
						{ __( 'Insert from Media Library' ) }
					</MediaUploadButton>
				</Placeholder>,
			];
		}

		return [
			controls,
			<section
				key="preview"
				data-url={ url }
				style={ style }
				className={ classes }
			>
				{ title || !! focus ? (
					<Editable
						tagName="h2"
						placeholder={ __( 'Write title…' ) }
						value={ title }
						focus={ focusedEditable === 'title' ? focus : null }
						onFocus={ ( props ) => setFocus( { ...props, editable: 'title' } ) }
						onChange={ ( value ) => setAttributes( { title: value } ) }
						inlineToolbar
					/>
				) : null }

				{ buttonText !== undefined &&
					<span className="wp-block-cover-image__button aligncenter" style={ { backgroundColor: buttonBackgroundColor } } >
						<Editable
							tagName="span"
							placeholder={ __( 'Add text…' ) }
							value={ buttonText }
							focus={ focusedEditable === 'button' ? focus : null }
							onFocus={ ( props ) => setFocus( { ...props, editable: 'button' } ) }
							onChange={ ( value ) => setAttributes( { buttonText: value } ) }
							formattingControls={ [ 'bold', 'italic', 'strikethrough' ] }
							style={ {
								color: buttonTextColor,
							} }
							keepPlaceholderOnFocus
						/>
						{ focusedEditable === 'button' &&
							<span
								className="blocks-format-toolbar__link-modal">
								<UrlInput
									value={ buttonUrl }
									onChange={ ( value ) => setAttributes( { buttonUrl: value } ) }
								/>
								<IconButton icon="editor-break" label={ __( 'Apply' ) } />
							</span>
						}
						{ focus &&
							<InspectorControls>
								<PanelBody title={ __( 'Button Background Color' ) }>
									<ColorPalette
										value={ buttonBackgroundColor }
										onChange={ ( value ) => setAttributes( { buttonBackgroundColor: value } ) }
									/>
								</PanelBody>
								<PanelBody title={ __( 'Button Text Color' ) }>
									<ColorPalette
										value={ buttonTextColor }
										onChange={ ( value ) => setAttributes( { buttonTextColor: value } ) }
									/>
								</PanelBody>
							</InspectorControls>
						}
					</span>
				}
			</section>,
		];
	},

	save( { attributes, className } ) {
		const { url, title, hasParallax, dimRatio, buttonBackgroundColor, buttonText, buttonTextColor, buttonUrl } = attributes;
		const style = url ?
			{ backgroundImage: `url(${ url })` } :
			undefined;
		const classes = classnames(
			className,
			dimRatioToClass( dimRatio ),
			{
				'has-background-dim': dimRatio !== 0,
				'has-parallax': hasParallax,
			}
		);

		return (
			<section className={ classes } style={ style }>
				<h2>{ title }</h2>
				{ buttonText !== undefined &&
					<a className="wp-block-cover-image__button aligncenter" style={ { backgroundColor: buttonBackgroundColor, color: buttonTextColor } } href={ buttonUrl } title={ title }>
						{ buttonText }
					</a>
				}
			</section>
		);
	},
} );

function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
