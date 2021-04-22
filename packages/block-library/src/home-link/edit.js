/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

const preventDefault = ( event ) => event.preventDefault();

export default function HomeEdit( {
	attributes,
	setAttributes,
	context,
	clientId,
} ) {
	const { homeUrl } = useSelect(
		( select ) => {
			const {
				getUnstableBase, //site index
			} = select( coreStore );
			return {
				homeUrl: getUnstableBase()?.home,
			};
		},
		[ clientId ]
	);

	const { textColor, backgroundColor, style } = context;
	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor || !! style?.color?.text,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor || !! style?.color?.background,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
		} ),
		style: {
			color: style?.color?.text,
			backgroundColor: style?.color?.background,
		},
	} );

	const { label, opensInNewTab, rel, title } = attributes;

	useEffect( () => {
		if ( label === undefined ) {
			setAttributes( { label: __( 'Home' ) } );
		}
	}, [ clientId, label ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Home link settings' ) }>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						checked={ opensInNewTab }
						onChange={ () => {
							setAttributes( { opensInNewTab: ! opensInNewTab } );
						} }
						help={ __( 'Opens the home link in a new tab' ) }
					/>
					<TextControl
						value={ title || '' }
						onChange={ ( titleValue ) => {
							setAttributes( { title: titleValue } );
						} }
						label={ __( 'Link title' ) }
						autoComplete="off"
					/>
					<TextControl
						value={ rel || '' }
						onChange={ ( relValue ) => {
							setAttributes( { rel: relValue } );
						} }
						label={ __( 'Link rel' ) }
						autoComplete="off"
					/>
				</PanelBody>
			</InspectorControls>
			<li { ...blockProps }>
				<a
					className="wp-block-home-link__content"
					href={ homeUrl }
					onClick={ preventDefault }
				>
					<RichText
						identifier="label"
						className="wp-block-home-link__label"
						value={ label }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						aria-label={ __( 'Home link text' ) }
						placeholder={ __( 'Add home link' ) }
						withoutInteractiveFormatting
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/image',
							'core/strikethrough',
						] }
					/>
				</a>
			</li>
		</>
	);
}
