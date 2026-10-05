import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useState } from '@wordpress/element';
import { Collapsible } from '@wordpress/ui';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { MediaCategoryPanel } from './media-panel';

type MediaCategory = {
	name: string;
	label: string;
};

type MediaCategoryListProps = {
	/**
	 * The media categories, each rendered as a collapsible panel.
	 */
	categories: MediaCategory[];
	/**
	 * Called with the block to insert.
	 */
	onInsert: ( block: unknown ) => void;
	/**
	 * Content pinned beneath the panels (e.g. the Media Library button).
	 */
	footer?: ReactNode;
};

// The category opened on mount: the whole image library, so the tab opens
// straight onto something browsable. Categories listed ahead of it (e.g.
// the post's attached images) keep their place but start collapsed.
const DEFAULT_OPEN_CATEGORY = 'images';

/**
 * The Media tab: every media category is a collapsible panel stacked in a
 * single column. At most one is open at a time and fills the height left
 * beneath the other panels' headers; the image library (or, failing that,
 * the first category) opens on mount, so the tab opens straight onto a
 * browsable library rather than a list to drill into.
 */
export default function MediaCategoryList( {
	categories,
	onInsert,
	footer,
}: MediaCategoryListProps ) {
	const [ openName, setOpenName ] = useState< string | undefined >(
		() =>
			(
				categories.find(
					( category ) => category.name === DEFAULT_OPEN_CATEGORY
				) ?? categories[ 0 ]
			)?.name
	);

	return (
		<div className="block-editor-inserter__media-category-list">
			{ categories.map( ( category ) => {
				const isOpen = category.name === openName;
				return (
					<Collapsible.Root
						key={ category.name }
						open={ isOpen }
						onOpenChange={ ( open ) => {
							setOpenName( open ? category.name : undefined );
						} }
						className={ clsx(
							'block-editor-inserter__media-category-list__category',
							{
								'is-open': isOpen,
							}
						) }
					>
						<Collapsible.Trigger className="block-editor-inserter__media-category-list__trigger">
							<span className="block-editor-inserter__media-category-list__label">
								{ category.label }
							</span>
							<Icon icon={ isOpen ? chevronUp : chevronDown } />
						</Collapsible.Trigger>
						<Collapsible.Panel className="block-editor-inserter__media-category-list__panel">
							<MediaCategoryPanel
								onInsert={ onInsert }
								category={ category }
							/>
						</Collapsible.Panel>
					</Collapsible.Root>
				);
			} ) }
			{ footer && (
				<div className="block-editor-inserter__media-category-list__footer">
					{ footer }
				</div>
			) }
		</div>
	);
}
