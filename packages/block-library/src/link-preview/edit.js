/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';
import { __experimentalFetchUrlData } from '@wordpress/core-data';
import { Placeholder, Spinner, Button } from '@wordpress/components';

export default function LinkPreviewEdit( props ) {
	const {
		attributes: { url, title, icon, image },
		setAttributes,
	} = props;
	const [ isFetching, setIsFetching ] = useState( false );

	useEffect( () => {
		if ( ! url ) {
			return;
		}

		// Try fetching preview.
		setIsFetching( true );
		__experimentalFetchUrlData( url )
			.then( ( data ) => {
				setAttributes( data );
			} )
			.finally( () => {
				setIsFetching( false );
			} );
	}, [ url ] );

	const [ urlValue, setURLValue ] = useState( '' );

	const blockProps = useBlockProps( {
		href: url,
		onClick:
			url && title
				? ( event ) => {
						event.preventDefault();
				  }
				: undefined,
	} );

	if ( ! url ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ icon }
					label={ __( 'URL' ) }
					instructions={ __(
						'Paste a link to the content you want to display on your site.'
					) }
				>
					<form
						onSubmit={ () => {
							setAttributes( { url: urlValue } );
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
					</form>
				</Placeholder>
			</div>
		);
	}

	if ( ! title ) {
		return (
			<a { ...blockProps }>
				{ url }
				{ isFetching && <Spinner /> }
			</a>
		);
	}

	return (
		<a { ...blockProps }>
			<img src={ image } alt={ title } />
			<div>
				<strong>{ title }</strong>
				<br />
				<span>
					<img
						className="link-preview__icon"
						src={ icon }
						alt={ new URL( url ).host }
					/>{ ' ' }
					{ new URL( url ).host }
				</span>
			</div>
		</a>
	);
}
