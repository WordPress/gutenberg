/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useBlockProps, BlockControls } from '@wordpress/block-editor';
import { __experimentalFetchUrlData } from '@wordpress/core-data';
import {
	Placeholder,
	Spinner,
	Button,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { link, edit } from '@wordpress/icons';

export default function LinkPreviewEdit( props ) {
	const {
		attributes: { url, title, icon, image },
		setAttributes,
	} = props;
	const [ isFetching, setIsFetching ] = useState( false );
	const [ isEditingUrl, setIsEditingUrl ] = useState( ! url );
	const [ urlValue, setURLValue ] = useState( '' );

	const blockProps = useBlockProps( {
		href: url,
		className: image ? 'has-image' : undefined,
		onClick: isEditingUrl
			? undefined
			: ( event ) => {
					event.preventDefault();
			  },
	} );

	if ( isEditingUrl ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ link }
					label={ __( 'URL' ) }
					instructions={ __(
						'Paste a link to the content you want to display on your site.'
					) }
				>
					<form
						onSubmit={ () => {
							setAttributes( {
								url: urlValue,
								title: '',
								icon: '',
								image: '',
								description: '',
							} );
							setIsFetching( true );
							__experimentalFetchUrlData( urlValue )
								.then( ( data ) => {
									setAttributes( data );
									setIsEditingUrl( false );
								} )
								.finally( () => {
									setIsFetching( false );
								} );
						} }
					>
						<input
							type="url"
							value={ urlValue }
							className="components-placeholder__input"
							aria-label={ __( 'URL' ) }
							placeholder={ __( 'Enter URL to embed here…' ) }
							onChange={ ( event ) => {
								setURLValue( event.target.value );
							} }
						/>
						<Button variant="primary" type="submit">
							{ _x( 'Embed', 'button label' ) }
						</Button>
						{ isFetching && <Spinner /> }
					</form>
				</Placeholder>
			</div>
		);
	}

	return (
		<a { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						className="components-toolbar__control"
						label={ __( 'Edit URL' ) }
						icon={ edit }
						onClick={ () => {
							setIsEditingUrl( true );
							setURLValue( url );
						} }
					/>
				</ToolbarGroup>
			</BlockControls>
			{ image && <img src={ image } alt={ title } /> }
			<div>
				{ title && <strong>{ title }</strong> }
				{ icon && (
					<img
						className="link-preview__icon"
						src={ icon }
						alt={ new URL( url ).host }
					/>
				) }
				{ title ? new URL( url ).host.replace( /^www\./, '' ) : url }
			</div>
		</a>
	);
}
