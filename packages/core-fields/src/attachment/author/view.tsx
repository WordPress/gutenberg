import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { Icon, Stack } from '@wordpress/ui';
import type { MediaItem } from '../types';
import styles from './style.module.css';

/*
 * A copy of the author view of `@wordpress/media-fields`, laid out with
 * `Stack` instead of the `HStack` of `@wordpress/components`, and styled with
 * a CSS module.
 */
export default function AuthorView( { item }: { item: MediaItem } ) {
	const author = item?._embedded?.author?.[ 0 ];
	const text = author?.name;
	const imageUrl = author?.avatar_urls?.[ 48 ];

	/*
	 * Use three states to avoid fade-in animation for cached images:
	 * 'instant' = image already cached, 'loading' = waiting, 'loaded' = just finished.
	 */
	const [ loadingState, setLoadingState ] = useState<
		'instant' | 'loading' | 'loaded'
	>( 'loading' );

	useEffect( () => {
		setLoadingState( 'loading' );
	}, [ imageUrl ] );

	const imgRef = useCallback( ( img: HTMLImageElement | null ) => {
		if ( img?.complete ) {
			setLoadingState( 'instant' );
		}
	}, [] );

	const handleLoad = () => {
		if ( loadingState === 'loading' ) {
			setLoadingState( 'loaded' );
		}
	};

	return (
		<Stack direction="row" align="center" justify="flex-start">
			{ !! imageUrl && (
				<div
					className={ clsx( styles.avatar, {
						[ styles[ 'is-loading' ] ]: loadingState === 'loading',
						[ styles[ 'is-loaded' ] ]: loadingState === 'loaded',
					} ) }
				>
					<img
						ref={ imgRef }
						onLoad={ handleLoad }
						alt={ __( 'Author avatar' ) }
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className={ styles.icon }>
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className={ styles.name }>{ text }</span>
		</Stack>
	);
}
