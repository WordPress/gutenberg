/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { Icon, __experimentalHStack as HStack } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { commentAuthorAvatar as authorIcon } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useAddedBy } from './hooks';
import { LAYOUT_LIST } from '../../utils/constants';

function BaseAuthorField( { viewType, text, icon, imageUrl } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const withIcon = viewType !== LAYOUT_LIST;

	return (
		<HStack alignment="left" spacing={ 1 }>
			{ withIcon && imageUrl && (
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
			{ withIcon && ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

export function TemplateAuthorField( { item, viewType } ) {
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<BaseAuthorField
			viewType={ viewType }
			text={ text }
			icon={ icon }
			imageUrl={ imageUrl }
		/>
	);
}

export function PostAuthorField( { item, viewType } ) {
	const { text, icon, imageUrl } = useSelect(
		( select ) => {
			const { getUser } = select( coreStore );
			const user = getUser( item.author );
			return {
				icon: authorIcon,
				imageUrl: user?.avatar_urls?.[ 48 ],
				text: user?.name,
			};
		},
		[ item ]
	);
	return (
		<BaseAuthorField
			viewType={ viewType }
			text={ text }
			icon={ icon }
			imageUrl={ imageUrl }
		/>
	);
}
