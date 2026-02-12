/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Button,
	Navigator,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { chevronLeft } from '@wordpress/icons';
import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { Revision, GuidelineCategories } from '../types';

interface RevisionItem {
	id: string;
	revisionId: number;
	date: string;
	authorName: string;
	isCurrent: boolean;
	categories: GuidelineCategories;
}

interface RevisionHistoryScreenProps {
	revisions: Array< Revision & { categories: GuidelineCategories } >;
	currentRevisionId: number | null;
	onRestore: ( revisionId: number, categories: GuidelineCategories ) => void;
}

export default function RevisionHistoryScreen( {
	revisions,
	currentRevisionId,
	onRestore,
}: RevisionHistoryScreenProps ) {
	const items: RevisionItem[] = useMemo( () => {
		return revisions.map( ( revision ) => ( {
			id: String( revision.id ),
			revisionId: revision.id,
			date: revision.date,
			authorName: revision.author_name || __( 'Unknown' ),
			isCurrent: revision.id === currentRevisionId,
			categories: revision.categories,
		} ) );
	}, [ revisions, currentRevisionId ] );

	const uniqueAuthors = useMemo( () => {
		const names = [
			...new Set( items.map( ( item ) => item.authorName ) ),
		];
		return names.map( ( name ) => ( { value: name, label: name } ) );
	}, [ items ] );

	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		fields: [ 'date', 'authorName' ],
		page: 1,
		perPage: 10,
	} );

	const handleChangeView = useCallback( ( newView: View ) => {
		setView( newView );
	}, [] );

	const fields: Field< RevisionItem >[] = useMemo(
		() => [
			{
				id: 'date',
				label: __( 'Date' ),
				enableSorting: false,
				render: ( { item } ) => (
					<span>
						{ dateI18n( 'F j, Y \\a\\t g:i a', item.date ) }
						{ item.isCurrent && <em> ({ __( 'current' ) })</em> }
					</span>
				),
			},
			{
				id: 'authorName',
				label: __( 'User' ),
				enableSorting: false,
				enableGlobalSearch: true,
				elements: uniqueAuthors,
				filterBy: {
					operators: [ 'is', 'isNot' ],
				},
			},
		],
		[ uniqueAuthors ]
	);

	const { data, paginationInfo } = useMemo( () => {
		return filterSortAndPaginate( items, view, fields );
	}, [ items, view, fields ] );

	const actions: Action< RevisionItem >[] = useMemo(
		() => [
			{
				id: 'restore',
				label: __( 'Restore' ),
				modalHeader: __( 'Restore content guidelines' ),
				RenderModal: ( {
					items: modalItems,
					closeModal,
				}: {
					items: RevisionItem[];
					closeModal?: () => void;
				} ) => {
					const item = modalItems[ 0 ];
					const formattedDate = dateI18n(
						'F j, Y \\a\\t g:i a',
						item.date
					);

					return (
						<VStack spacing={ 4 }>
							<Text>
								{ __(
									'You are about to restore the content guidelines from'
								) }{ ' ' }
								{ formattedDate }.
							</Text>
							<Text>
								<strong>
									{ __( 'This action cannot be undone.' ) }
								</strong>
							</Text>
							<HStack justify="right" spacing={ 3 }>
								<Button
									variant="tertiary"
									onClick={ closeModal }
									__next40pxDefaultSize
								>
									{ __( 'Cancel' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ () => {
										onRestore(
											item.revisionId,
											item.categories
										);
										closeModal?.();
									} }
									__next40pxDefaultSize
								>
									{ __( 'Restore' ) }
								</Button>
							</HStack>
						</VStack>
					);
				},
				isEligible: ( item: RevisionItem ) => ! item.isCurrent,
			},
		],
		[ onRestore ]
	);

	return (
		<div className="content-guidelines__item-edit">
			<VStack spacing={ 4 }>
				<HStack spacing={ 1 } alignment="left">
					<Navigator.BackButton
						icon={ chevronLeft }
						aria-label={ __(
							'Go back to content guidelines list'
						) }
						size="small"
					/>
					<h2 className="content-guidelines__item-edit-title">
						{ __( 'Revision history' ) }
					</h2>
				</HStack>
				<Text
					variant="muted"
					className="content-guidelines__item-edit-description"
				>
					{ __(
						'Use a previous version of your content guidelines.'
					) }
				</Text>

				{ items.length === 0 ? (
					<Text>{ __( 'No revisions yet.' ) }</Text>
				) : (
					<DataViews
						data={ data }
						fields={ fields }
						view={ view }
						onChangeView={ handleChangeView }
						actions={ actions }
						paginationInfo={ paginationInfo }
						defaultLayouts={ {
							table: {},
						} }
						search
						getItemId={ ( item: RevisionItem ) => item.id }
					/>
				) }
			</VStack>
		</div>
	);
}
