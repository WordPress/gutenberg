/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { count as wordCount } from '@wordpress/wordcount';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import StatusLabel from './status-label';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

// Taken from packages/editor/src/components/time-to-read/index.js.
const AVERAGE_READING_RATE = 189;

function getPageDetails( page ) {
	if ( ! page ) {
		return [];
	}

	const details = [
		{
			label: __( 'Status' ),
			value: (
				<StatusLabel
					status={ page?.password ? 'protected' : page.status }
					date={ page?.date }
				/>
			),
		},
		{
			label: __( 'Slug' ),
			value: <Truncate numberOfLines={ 1 }>{ page.slug }</Truncate>,
		},
	];

	if ( page?.templateTitle ) {
		details.push( {
			label: __( 'Template' ),
			value: decodeEntities( page.templateTitle ),
		} );
	}

	details.push( {
		label: __( 'Parent' ),
		// `null` indicates no parent.
		value:
			null === page?.parentTitle
				? __( 'Top level' )
				: decodeEntities( page?.parentTitle || __( '(no title)' ) ),
	} );

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	const wordCountType = _x( 'words', 'Word count type. Do not translate!' );
	const wordsCounted = page?.content?.rendered
		? wordCount( page.content.rendered, wordCountType )
		: 0;
	const readingTime = Math.round( wordsCounted / AVERAGE_READING_RATE );

	if ( wordsCounted ) {
		details.push(
			{
				label: __( 'Words' ),
				value: wordsCounted.toLocaleString() || __( 'Unknown' ),
			},
			{
				label: __( 'Time to read' ),
				value:
					readingTime > 1
						? sprintf(
								/* translators: %s: is the number of minutes. */
								__( '%s mins' ),
								readingTime.toLocaleString()
						  )
						: __( '< 1 min' ),
			}
		);
	}
	return details;
}

export default function PageDetails( { id } ) {
	const { record } = useEntityRecord( 'postType', 'page', id );

	const { parentTitle, templateTitle } = useSelect(
		( select ) => {
			const { getEditedPostContext, getSettings } = unlock(
				select( editSiteStore )
			);
			const defaultTemplateTypes = getSettings()?.defaultTemplateTypes;
			const postContext = getEditedPostContext();

			// Template title.
			const templateSlug =
				// Checks that the post type matches the current theme's post type, otherwise
				// the templateSlug returns 'home'.
				postContext?.postType === 'page'
					? postContext?.templateSlug
					: null;
			const _templateTitle =
				defaultTemplateTypes && templateSlug
					? defaultTemplateTypes.find(
							( template ) => template.slug === templateSlug
					  )?.title
					: null;

			// Parent page title.
			const _parentTitle = record?.parent
				? select( coreStore ).getEntityRecord(
						'postType',
						'page',
						record.parent,
						{
							_fields: [ 'title' ],
						}
				  )?.title?.rendered
				: null;

			return {
				parentTitle: _parentTitle,
				templateTitle: _templateTitle,
			};
		},
		[ record ]
	);
	return (
		<VStack spacing={ 5 }>
			{ getPageDetails( {
				parentTitle,
				templateTitle,
				...record,
			} ).map( ( { label, value } ) => (
				<HStack
					key={ label }
					spacing={ 5 }
					alignment="left"
					className="edit-site-sidebar-navigation-screen-page__details"
				>
					<Text className="edit-site-sidebar-navigation-screen-page__details-label">
						{ label }
					</Text>
					<Text className="edit-site-sidebar-navigation-screen-page__details-value">
						{ value }
					</Text>
				</HStack>
			) ) }
		</VStack>
	);
}
