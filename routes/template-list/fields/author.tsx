import clsx from 'clsx';
import {
	Icon as WCIcon,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

function useAddedBy( type: string, id: any ) {
	const { author, authorText } = useSelect(
		( select ) => {
			const { getUser, getEditedEntityRecord } = select( coreStore );
			/* Templates carry `author`/`author_text`, which the selector's
			   entity record union does not know about. */
			const _record = ( getEditedEntityRecord( 'postType', type, id ) ||
				undefined ) as
				| { author?: number; author_text?: string }
				| undefined;
			return {
				author: _record?.author ? getUser( _record.author ) : null,
				authorText: _record?.author_text,
			};
		},
		[ type, id ]
	);

	return useMemo( () => {
		if ( authorText ) {
			return {
				text: authorText,
				icon: 'admin-plugins' as const,
			};
		}

		if ( author ) {
			return {
				text: author.name,
				icon: 'admin-users' as const,
				imageUrl: author.avatar_urls?.[ 48 ],
			};
		}

		return {
			text: __( 'Unknown' ),
			icon: 'admin-users' as const,
		};
	}, [ author, authorText ] );
}

function AuthorField( { item }: { item: any } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<HStack alignment="left" spacing={ 0 }>
			{ imageUrl && (
				<div
					className={ clsx(
						'routes-template-list-author-field__avatar',
						{
							'is-loaded': isImageLoaded,
						}
					) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="routes-template-list-author-field__icon">
					<WCIcon icon={ icon } />
				</div>
			) }
			<span className="routes-template-list-author-field__name">
				{ text }
			</span>
		</HStack>
	);
}

export const authorField = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item }: { item: any } ) => item.author_text ?? item.author,
	render: AuthorField,
};
