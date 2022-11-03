/**
 * External dependencies
 */
import classnames from 'classnames';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		url,
		alt,
		caption,
		align,
		href,
		rel,
		linkClass,
		width,
		height,
		id,
		linkTarget,
		sizeSlug,
		title,
	} = attributes;

	const newRel = isEmpty( rel ) ? undefined : rel;
	const borderProps = getBorderClassesAndStyles( attributes );

	const classes = classnames( {
		[ `align${ align }` ]: align,
		[ `size-${ sizeSlug }` ]: sizeSlug,
		'is-resized': width || height,
		'has-custom-border':
			!! borderProps.className || ! isEmpty( borderProps.style ),
	} );

	const imageClasses = classnames( borderProps.className, {
		[ `wp-image-${ id }` ]: !! id,
	} );

	let describedById = 'wp-image-caption';
	if ( url ) {
		// Use the hashed url to create an ID to use with aria-describedby.
		const hashString = ( str ) =>
			str
				.split( '' )
				.map( ( c ) =>
					c.charCodeAt( 0 ).toString( 32 ).padStart( 2, '0' )
				)
				.join( '' );
		describedById = `wp-image-caption-${ hashString( url ) }`;
	}

	const image = (
		<img
			src={ url }
			alt={ alt }
			aria-describedby={
				! alt && ! RichText.isEmpty( caption ) && ! href
					? describedById
					: undefined
			}
			className={ imageClasses || undefined }
			style={ borderProps.style }
			width={ width }
			height={ height }
			title={ title }
		/>
	);

	const figure = (
		<>
			{ href ? (
				<a
					className={ linkClass }
					href={ href }
					target={ linkTarget }
					rel={ newRel }
					aria-describedby={
						! alt && ! RichText.isEmpty( caption )
							? describedById
							: undefined
					}
				>
					{ image }
				</a>
			) : (
				image
			) }
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
					id={
						! alt && ! RichText.isEmpty( caption )
							? describedById
							: undefined
					}
				/>
			) }
		</>
	);

	return (
		<figure { ...useBlockProps.save( { className: classes } ) }>
			{ figure }
		</figure>
	);
}
