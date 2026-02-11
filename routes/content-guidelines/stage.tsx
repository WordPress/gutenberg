/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Navigator, useNavigator } from '@wordpress/components';
import { useState, useCallback } from '@wordpress/element';
import {
	image,
	layout,
	formatListBullets,
	termDescription,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { GuidelineCategories, Revision } from './types';
import { DEFAULT_CATEGORIES } from './types';
import GuidelineItemCard from './components/guideline-item-card';
import GuidelineItemEdit from './components/guideline-item-edit';
import ActionsSection from './components/actions-section';
import RevisionHistoryScreen from './components/revision-history-screen';
import './style.scss';

const GUIDELINE_ITEMS = [
	{
		icon: layout,
		title: __( 'Site' ),
		description: __(
			"Describe your site's purpose, goals, and primary audience."
		),
		descriptionLong: __(
			"Describe your site's purpose, goals, and primary audience. This helps creators develop content that resonates with your readers."
		),
		slug: 'site' as const,
	},
	{
		icon: termDescription,
		title: __( 'Copy' ),
		description: __(
			'Set your writing standards for tone, voice, style, and formatting.'
		),
		descriptionLong: __(
			'Set your writing standards for tone, voice, style, and formatting. Include brand terminology and content to avoid so all writing stays consistent.'
		),
		slug: 'copy' as const,
	},
	{
		icon: image,
		title: __( 'Images' ),
		description: __(
			'Outline your style, dimensions, formats, mood and aesthetic preferences.'
		),
		descriptionLong: __(
			'Outline your style, subject matter, technical requirements (dimensions, formats), mood and aesthetic preferences, and images to avoid. This ensures consistent, accessible imagery.'
		),
		slug: 'images' as const,
	},
	{
		icon: formatListBullets,
		title: __( 'Additional guidelines' ),
		description: __(
			'Include any additional standards such as SEO preferences, legal requirements, citation styles, or other content considerations.'
		),
		descriptionLong: __(
			'Include any additional standards such as SEO preferences, legal requirements, citation styles, or other content considerations.'
		),
		slug: 'other' as const,
	},
];

type CategorySlug = ( typeof GUIDELINE_ITEMS )[ number ][ 'slug' ];

function GuidelineListScreen( {
	guidelines,
	onImport,
}: {
	guidelines: GuidelineCategories | null;
	onImport: ( categories: GuidelineCategories ) => void;
} ) {
	const navigator = useNavigator();

	const handleSelectGuideline = ( slug: string ) => {
		navigator.goTo( `/guideline/${ slug }` );
	};

	return (
		<div className="content-guidelines__content">
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */
			/* eslint-disable jsx-a11y/no-redundant-roles */ }
			<ul role="list" className="content-guidelines__list">
				{ GUIDELINE_ITEMS.map( ( item ) => (
					<li
						key={ item.slug }
						className="content-guidelines__list-item"
					>
						<GuidelineItemCard
							icon={ item.icon }
							title={ item.title }
							description={ item.description }
							onClick={ () => handleSelectGuideline( item.slug ) }
						/>
					</li>
				) ) }
			</ul>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }

			<ActionsSection guidelines={ guidelines } onImport={ onImport } />
		</div>
	);
}

function ContentGuidelinesPage() {
	const [ guidelines, setGuidelines ] =
		useState< GuidelineCategories | null >( null );
	const [ revisions, setRevisions ] = useState<
		Array< Revision & { categories: GuidelineCategories } >
	>( [] );

	const handleImport = useCallback( ( categories: GuidelineCategories ) => {
		setGuidelines( categories );
		setRevisions( ( prev ) => [
			{
				id: Date.now(),
				date: new Date().toISOString(),
				author_name: 'Admin',
				categories,
			},
			...prev,
		] );
	}, [] );

	const handleSaveCategory = useCallback(
		( slug: CategorySlug, content: string ) => {
			setGuidelines( ( prev ) => {
				const base = prev ?? DEFAULT_CATEGORIES;
				const updated = {
					...base,
					[ slug ]: {
						...base[ slug ],
						guidelines: content,
					},
				};
				setRevisions( ( prevRevisions ) => [
					{
						id: Date.now(),
						date: new Date().toISOString(),
						author_name: 'Admin',
						categories: updated,
					},
					...prevRevisions,
				] );
				return updated;
			} );
		},
		[]
	);

	const handleRestore = useCallback( ( categories: GuidelineCategories ) => {
		setGuidelines( categories );
	}, [] );

	return (
		<Page
			title={ __( 'Content guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			<Navigator initialPath="/">
				<Navigator.Screen path="/">
					<GuidelineListScreen
						guidelines={ guidelines }
						onImport={ handleImport }
					/>
				</Navigator.Screen>

				{ GUIDELINE_ITEMS.map( ( item ) => (
					<Navigator.Screen
						key={ item.slug }
						path={ `/guideline/${ item.slug }` }
					>
						<GuidelineItemEdit
							title={ item.title }
							description={ item.descriptionLong }
							initialValue={
								guidelines?.[ item.slug ]?.guidelines ?? ''
							}
							onSave={ ( content ) =>
								handleSaveCategory( item.slug, content )
							}
						/>
					</Navigator.Screen>
				) ) }

				<Navigator.Screen path="/revisions">
					<RevisionHistoryScreen
						revisions={ revisions }
						onRestore={ handleRestore }
					/>
				</Navigator.Screen>
			</Navigator>
		</Page>
	);
}

export const stage = ContentGuidelinesPage;
