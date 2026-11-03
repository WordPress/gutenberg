import clsx from 'clsx';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import {
	__experimentalHStack as HStack,
	Icon as WCIcon,
} from '@wordpress/components';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import type { MediaItem } from '../types';

export default function AuthorView( {
	item,
}: DataViewRenderFieldProps< MediaItem > ) {
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
		<HStack alignment="left" spacing={ 0 }>
			{ !! imageUrl && (
				<div
					className={ clsx( 'media-author-field__avatar', {
						'is-loading': loadingState === 'loading',
						'is-loaded': loadingState === 'loaded',
					} ) }
				>
					{ /* Decorative: the author's name follows it, so naming
					     the image would only repeat that name. */ }
					<img
						ref={ imgRef }
						onLoad={ handleLoad }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="media-author-field__icon">
					<WCIcon icon={ authorIcon } />
				</div>
			) }
			<span className="media-author-field__name">{ text }</span>
		</HStack>
	);
}
