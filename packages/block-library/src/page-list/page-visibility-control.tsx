import { CheckboxControl } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __ } from '@wordpress/i18n';
import { Fieldset } from '@wordpress/ui';

type Page = {
	id: number;
	title?: { rendered?: string };
};

type PagesByParentId = Map< number, Page[] >;

function PageVisibilityOptions( {
	pagesByParentId,
	parentId,
	excludedPageIDs,
	isParentHidden,
	onToggle,
}: {
	pagesByParentId: PagesByParentId;
	parentId: number;
	excludedPageIDs: number[];
	isParentHidden: boolean;
	onToggle: ( pageId: number, isVisible: boolean ) => void;
} ) {
	const childPages = pagesByParentId.get( parentId );

	if ( ! childPages?.length ) {
		return null;
	}

	return (
		<ul className="wp-block-page-list__visibility-options">
			{ childPages.map( ( page ) => {
				const isExcluded = excludedPageIDs.includes( page.id );
				const title = stripHTML( page.title?.rendered ?? '' ).trim();
				return (
					<li key={ page.id }>
						<CheckboxControl
							label={ title || __( '(no title)' ) }
							checked={ ! isExcluded && ! isParentHidden }
							// A subpage can't be shown while its parent is
							// hidden, so only its parent can be toggled.
							disabled={ isParentHidden }
							onChange={ ( isVisible ) =>
								onToggle( page.id, isVisible )
							}
						/>
						<PageVisibilityOptions
							pagesByParentId={ pagesByParentId }
							parentId={ page.id }
							excludedPageIDs={ excludedPageIDs }
							isParentHidden={ isParentHidden || isExcluded }
							onToggle={ onToggle }
						/>
					</li>
				);
			} ) }
		</ul>
	);
}

/**
 * Lists the pages a Page List can show, with a checkbox to hide each one.
 *
 * @param props                 Component props.
 * @param props.pagesByParentId Pages grouped by their parent ID.
 * @param props.parentPageID    ID of the page whose subpages are listed.
 * @param props.excludedPageIDs IDs of the hidden pages.
 * @param props.onChange        Called with the new list of hidden page IDs.
 */
export default function PageVisibilityControl( {
	pagesByParentId,
	parentPageID,
	excludedPageIDs,
	onChange,
}: {
	pagesByParentId: PagesByParentId;
	parentPageID: number;
	excludedPageIDs: number[];
	onChange: ( excludedPageIDs: number[] ) => void;
} ) {
	const onToggle = ( pageId: number, isVisible: boolean ) => {
		onChange(
			isVisible
				? excludedPageIDs.filter( ( id ) => id !== pageId )
				: [ ...excludedPageIDs, pageId ]
		);
	};

	return (
		<Fieldset.Root>
			<Fieldset.Legend>{ __( 'Visible pages' ) }</Fieldset.Legend>
			<PageVisibilityOptions
				pagesByParentId={ pagesByParentId }
				parentId={ parentPageID }
				excludedPageIDs={ excludedPageIDs }
				isParentHidden={ false }
				onToggle={ onToggle }
			/>
			<Fieldset.Description>
				{ __(
					'Hidden pages and their subpages are not shown. New pages are shown automatically.'
				) }
			</Fieldset.Description>
		</Fieldset.Root>
	);
}
