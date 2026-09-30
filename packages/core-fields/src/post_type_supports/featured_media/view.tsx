import clsx from 'clsx';
import type { PostWithFeaturedMedia } from './types';
import styles from './style.module.css';

/*
 * A copy of the featured image view of `@wordpress/fields`. The editors
 * style it by the class names of the original, which the CSS module keeps
 * next to its own.
 */
export default function FeaturedImageView( {
	item,
	config,
}: {
	item: PostWithFeaturedMedia;
	config?: { sizes?: string };
} ) {
	const media = item?._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
	const url = media?.source_url;

	if ( ! url ) {
		return (
			<span
				className={ clsx(
					'fields-controls__featured-image-placeholder',
					styles.placeholder
				) }
			/>
		);
	}

	const sizes = media?.media_details?.sizes;
	return (
		<img
			className={ clsx(
				'fields-controls__featured-image-image',
				styles.image
			) }
			src={ url }
			alt=""
			srcSet={
				sizes
					? Object.values( sizes )
							.map(
								( size ) =>
									`${ size.source_url } ${ size.width }w`
							)
							.join( ', ' )
					: undefined
			}
			sizes={ config?.sizes || '100vw' }
		/>
	);
}
