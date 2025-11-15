/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { __experimentalHStack as HStack, Icon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedAuthor } from '../../types';

function AuthorView( { item }: { item: BasePostWithEmbeddedAuthor } ) {
	const text = item?._embedded?.author?.[ 0 ]?.name;
	const imageUrl = item?._embedded?.author?.[ 0 ]?.avatar_urls?.[ 48 ];

	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	return (
		<HStack alignment="left" spacing={ 0 }>
			{ !! imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt={ __( 'Author avatar' ) }
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ authorIcon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

export default AuthorView;
