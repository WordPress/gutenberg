/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import type { Attachment } from '@wordpress/core-data';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
// @ts-ignore
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { __experimentalHStack as HStack } from '@wordpress/components';
/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { __ } from '@wordpress/i18n';
import type { BasePost } from '../../types';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';
import { getItemTitle } from '../../actions/utils';

const { useHistory } = unlock( routerPrivateApis );

const Media = ( {
	id,
	size = [ 'large', 'medium', 'thumbnail' ],
	...props
}: {
	id: number;
	size?: Array< 'large' | 'medium' | 'full' | 'thumbnail' >;
} & Record< string, any > ) => {
	const { record: media } = useEntityRecord< Attachment >(
		'root',
		'media',
		id
	);

	const currentSize =
		size.find( ( s ) => !! media?.media_details?.sizes[ s ] ) ?? '';

	const mediaUrl =
		media?.media_details?.sizes[ currentSize ]?.source_url ||
		media?.source_url;

	if ( ! mediaUrl ) {
		return null;
	}

	return <img { ...props } src={ mediaUrl } alt={ media.alt_text } />;
};

const getComponentToDisplay = ( {
	item,
	url,
	title,
	onClick,
}: {
	item: BasePost;
	title: string | undefined;
	url: string | undefined;
	onClick: () => void;
} ) => ( {
	grid: {
		NoUrl: <></>,
		WithUrl: (
			<>
				<button
					className="fields-controls__featured-image-button"
					type="button"
					onClick={ onClick }
					aria-label={ getItemTitle( item ) ?? __( '(no title)' ) }
				>
					{ item.featured_media && (
						<Media
							className="fields-controls__featured-image-image"
							id={ item.featured_media }
							size={ [ 'large', 'full', 'medium', 'thumbnail' ] }
						/>
					) }
					{ ! item.featured_media && <></> }
				</button>
			</>
		),
	},
	list: {
		NoUrl: <></>,
		WithUrl: (
			<div className="fields-controls__featured-image-container">
				<img
					className="fields-controls__featured-image-image"
					src={ url }
					alt=""
				/>
			</div>
		),
	},
	panel: {
		NoUrl: (
			<HStack className="fields-controls__featured-image-container">
				<span
					style={ {
						width: '16px',
						height: '16px',
					} }
					className="fields-controls__featured-image-placeholder"
				/>
				<span>{ __( 'Choose an image…' ) }</span>
			</HStack>
		),
		WithUrl: (
			<HStack className="fields-controls__featured-image-container">
				<img
					className="fields-controls__featured-image-image"
					src={ url }
					width={ 16 }
					height={ 16 }
					alt=""
				/>
				<span>{ title }</span>
			</HStack>
		),
	},
	table: {
		NoUrl: (
			<span
				style={ {
					width: '32px',
					height: '32px',
				} }
				className="fields-controls__featured-image-placeholder"
			/>
		),
		WithUrl: (
			<HStack className="fields-controls__featured-image-container">
				<img
					className="fields-controls__featured-image-image"
					src={ url }
					alt=""
					width={ 32 }
					height={ 32 }
				/>
			</HStack>
		),
	},
} );

export const FeaturedImageView = ( {
	item,
	view,
}: DataViewRenderFieldProps< BasePost > ) => {
	const mediaId = item.featured_media;

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return mediaId ? getEntityRecord( 'root', 'media', mediaId ) : null;
		},
		[ mediaId ]
	);
	const url = media?.source_url;
	const title = media?.title?.rendered;

	const history = useHistory();

	const onClick = useCallback( () => {
		const params = {
			post: item.id,
			post_type: item.type,
			canvas: 'edit',
		};

		history.push( params );
	}, [ history, item.id, item.type ] );

	const component = getComponentToDisplay( { item, title, url, onClick } )[
		view
	];

	if ( url ) {
		return component.WithUrl;
	}

	return component.NoUrl;
};
