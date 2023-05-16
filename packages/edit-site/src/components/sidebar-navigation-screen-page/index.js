/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	ExternalLink,
} from '@wordpress/components';
import {
	store as coreStore,
	useEntityRecord,
	useEntityRecords,
} from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SidebarNavigationScreen from '../sidebar-navigation-screen';
import { unlock } from '../../private-apis';
import { store as editSiteStore } from '../../store';
import SidebarButton from '../sidebar-button';
import SidebarNavigationSubtitle from '../sidebar-navigation-subtitle';
import SidebarDetails from '../sidebar-navigation-data-list';

function countWordsInHTML( htmlString ) {
	const parser = new window.DOMParser();
	const doc = parser.parseFromString( htmlString, 'text/html' );

	let wordCount = 0;

	function countWords( node ) {
		if ( node.nodeType === 3 ) {
			const text = node.textContent.trim();

			if ( text !== '' ) {
				const words = text.split( /\s+/ );
				wordCount += words.length;
			}
		} else if ( node.nodeType === 1 ) {
			const children = node.childNodes;
			for ( let i = 0; i < children.length; i++ ) {
				countWords( children[ i ] );
			}
		}
	}

	countWords( doc.body );
	return wordCount;
}
const estimateReadingTime = ( wordCount, wordsPerMinute = 200 ) =>
	Math.ceil( wordCount / wordsPerMinute );

function getPageDetails( page ) {
	if ( ! page ) {
		return [];
	}

	const wordCount = countWordsInHTML( page?.content?.rendered ) || 0;
	const readingTime = estimateReadingTime( wordCount );

	return [
		{
			label: 'Template',
			value: page?.templateTitle,
		},
		{
			label: 'Parent',
			value: page?.parentTitle,
		},
		{
			label: 'Words',
			value: wordCount.toLocaleString() || 'Unknown',
		},
		{
			label: 'Time to read',
			value:
				readingTime > 1
					? `${ readingTime.toLocaleString() } mins`
					: '1 min',
		},
	];
}

export default function SidebarNavigationScreenPage() {
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const {
		params: { postId },
	} = useNavigator();

	const { record } = useEntityRecord( 'postType', 'page', postId );
	const { records: templates, isResolving: areTemplatesLoading } =
		useEntityRecords( 'postType', 'wp_template', {
			per_page: -1,
		} );

	const templateTitle = areTemplatesLoading
		? ''
		: templates?.find( ( template ) => template?.slug === record?.template )
				?.title?.rendered || 'Default';

	const parentTitle = useSelect(
		( select ) => {
			const parent = record?.parent
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						record.parent
				  )
				: null;

			if ( parent ) {
				return parent?.title?.rendered
					? decodeEntities( parent.title.rendered )
					: 'No title';
			}

			return 'Top level';
		},
		[ record ]
	);

	return (
		<SidebarNavigationScreen
			title={ record ? decodeEntities( record?.title?.rendered ) : null }
			actions={
				<SidebarButton
					onClick={ () => setCanvasMode( 'edit' ) }
					label={ __( 'Edit' ) }
					icon={ pencil }
				/>
			}
			meta={
				record ? (
					<VStack spacing={ 3 }>
						{ record?.link && (
							<ExternalLink
								className="edit-site-sidebar-navigation-screen__page-link"
								href={ record.link }
							>
								{ record.link }
							</ExternalLink>
						) }
						<PostStatus
							status={ record.status }
							date={ record.date }
						/>
					</VStack>
				) : null
			}
			footer={
				record && (
					<PostModified
						date={ record.modified }
						user={ record.modifiedBy }
					/>
				)
			}
			content={
				<>
					<img
						alt={ record?.title || 'no description' }
						className="edit-site-sidebar-navigation-screen__page-image"
						src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80"
					/>
					{ record?.excerpt?.raw && (
						<Text>{ decodeEntities( record?.excerpt?.raw ) }</Text>
					) }
					<SidebarNavigationSubtitle>
						Details
					</SidebarNavigationSubtitle>
					<SidebarDetails
						details={ getPageDetails( {
							parentTitle,
							templateTitle,
							...record,
						} ) }
					/>
				</>
			}
		/>
	);
}

const statusLabels = {
	publish: 'Published',
	future: 'Scheduled',
	draft: 'Draft',
	pending: 'Pending',
};

function relativeTime( date1, date2 ) {
	const diffInSeconds = Math.abs( date1.getTime() - date2.getTime() ) / 1000;

	const units = [
		{ name: 'second', limit: 60, in_seconds: 1 },
		{ name: 'minute', limit: 3600, in_seconds: 60 },
		{ name: 'hour', limit: 86400, in_seconds: 3600 },
		{ name: 'day', limit: 604800, in_seconds: 86400 },
		{ name: 'week', limit: 2629743, in_seconds: 604800 },
		{ name: 'month', limit: 31556926, in_seconds: 2629743 },
		{ name: 'year', limit: Infinity, in_seconds: 31556926 },
	];

	let i = 0,
		unit;
	while ( ( unit = units[ i++ ] ) ) {
		if ( diffInSeconds < unit.limit || ! unit.limit ) {
			const diff = Math.floor( diffInSeconds / unit.in_seconds );
			return (
				diff +
				' ' +
				unit.name +
				( diff > 1 ? 's' : '' ) +
				' ' +
				( date1 > date2 ? 'ago' : 'from now' )
			);
		}
	}
}

export const PostStatus = ( { status, date } ) => {
	const statusLabel = statusLabels[ status ] ?? 'Unknown';
	const formattedDate = date
		? relativeTime( new Date(), new Date( date ) )
		: null;

	return (
		<HStack alignment="left" spacing={ 3 }>
			{ /* <StatusIcon status={ status } /> */ }
			<Text>{ statusLabel }</Text>
			{ formattedDate && <Text>{ formattedDate }</Text> }
		</HStack>
	);
};

// const StatusIcon = ( { status } ) => {
// 	switch ( status ) {
// 		case 'draft':
// 			return <DraftIcon />;
// 		case 'pending':
// 			return <PendingIcon />;
// 		case 'future':
// 			return <ScheduledIcon />;
// 		case 'publish':
// 			return <PublishIcon />;
// 	}
// 	return null;
// };

const PostModified = ( { date } ) => {
	return (
		<HStack
			className="edit-site-sidebar-modified"
			alignment="left"
			spacing={ 3 }
		>
			<div className="edit-site-sidebar-modified__avatar" />
			<Text>
				Last modified { relativeTime( new Date(), new Date( date ) ) }{ ' ' }
				by Dan
			</Text>
		</HStack>
	);
};

// const DraftIcon = () => (
// 	<SVG
// 		width="16"
// 		height="16"
// 		viewBox="0 0 16 16"
// 		fill="none"
// 		xmlns="http://www.w3.org/2000/svg"
// 	>
// 		<Path
// 			d="M12 8C12 10.2091 10.2091 12 8 12C8 10.5 8 10.2091 8 8C8 5.79086 8 6 8 4C10.2091 4 12 5.79086 12 8Z"
// 			fill="#F0B849"
// 		/>
// 	</SVG>
// );

// const PendingIcon = () => (
// 	<SVG
// 		width="16"
// 		height="16"
// 		viewBox="0 0 16 16"
// 		fill="none"
// 		xmlns="http://www.w3.org/2000/svg"
// 	>
// 		<G clipPath="url(#clip0_790_59125)">
// 			<Rect x="4" y="4" width="8" height="8" rx="4" fill="#F0B849" />
// 		</G>
// 		<Rect
// 			x="0.75"
// 			y="0.75"
// 			width="14.5"
// 			height="14.5"
// 			rx="7.25"
// 			stroke="#F0B849"
// 			strokeWidth="1.5"
// 		/>
// 		<defs>
// 			<clipPath id="clip0_790_59125">
// 				<Rect width="16" height="16" rx="8" fill="white" />
// 			</clipPath>
// 		</defs>
// 	</SVG>
// );

// const ScheduledIcon = () => (
// 	<SVG
// 		width="16"
// 		height="16"
// 		viewBox="0 0 16 16"
// 		fill="none"
// 		xmlns="http://www.w3.org/2000/svg"
// 	>
// 		<G clipPath="url(#clip0_763_59172)">
// 			<Circle cx="8" cy="8" r="4" fill="#4AB866" />
// 		</G>
// 		<Rect
// 			x="0.75"
// 			y="0.75"
// 			width="14.5"
// 			height="14.5"
// 			rx="7.25"
// 			stroke="#4AB866"
// 			strokeWidth="1.5"
// 		/>
// 		<defs>
// 			<clipPath id="clip0_763_59172">
// 				<Rect width="16" height="16" rx="8" fill="white" />
// 			</clipPath>
// 		</defs>
// 	</SVG>
// );

// const PublishIcon = () => (
// 	<SVG
// 		width="16"
// 		height="16"
// 		viewBox="0 0 16 16"
// 		fill="none"
// 		xmlns="http://www.w3.org/2000/svg"
// 	>
// 		<G clipPath="url(#clip0_823_59447)">
// 			<Rect width="16" height="16" rx="8" fill="#4AB866" />
// 			<Path
// 				d="M11.1328 4.7334L6.93281 10.4001L4.73281 8.7334L4.13281 9.5334L7.13281 11.8001L11.9328 5.3334L11.1328 4.7334Z"
// 				fill="#003008"
// 			/>
// 		</G>
// 		<defs>
// 			<clipPath id="clip0_823_59447">
// 				<Rect width="16" height="16" rx="8" fill="white" />
// 			</clipPath>
// 		</defs>
// 	</SVG>
// );
