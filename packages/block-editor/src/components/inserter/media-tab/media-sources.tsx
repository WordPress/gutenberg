import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useState } from '@wordpress/element';
import { Collapsible } from '@wordpress/ui';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { MediaCategoryPanel } from './media-panel';

type MediaSourceCategory = {
	name: string;
	label: string;
};

type MediaSourcesProps = {
	/**
	 * The media categories, each rendered as a collapsible panel.
	 */
	categories: MediaSourceCategory[];
	/**
	 * Client ID of the block the media is inserted into.
	 */
	rootClientId?: string;
	/**
	 * Called with the block to insert.
	 */
	onInsert: ( block: unknown ) => void;
	/**
	 * Content pinned beneath the panels (e.g. the Media Library button).
	 */
	footer?: ReactNode;
};

/**
 * The Media tab: every media source is a collapsible panel stacked in a single
 * column. Exactly one is open at a time and fills the height left
 * beneath the other panels' headers, so the tab opens straight onto a browsable
 * library rather than a list of sources to drill into.
 */
export default function MediaSources( {
	categories,
	rootClientId,
	onInsert,
	footer,
}: MediaSourcesProps ) {
	const [ openName, setOpenName ] = useState< string | undefined >(
		categories[ 0 ]?.name
	);
	// If the categories change underneath us (e.g. the attached images source
	// appears once the post is saved) keep a panel open rather than none.
	const openCategory =
		categories.find( ( category ) => category.name === openName ) ??
		categories[ 0 ];
	const baseCssClass = 'block-editor-inserter__media-sources';

	return (
		<div className={ baseCssClass }>
			{ categories.map( ( category ) => {
				const isOpen = category === openCategory;
				return (
					<Collapsible.Root
						key={ category.name }
						open={ isOpen }
						onOpenChange={ ( open ) => {
							// One panel is always open: opening another closes
							// the current one, and the open one can't be
							// collapsed on its own.
							if ( open ) {
								setOpenName( category.name );
							}
						} }
						className={ clsx( `${ baseCssClass }__source`, {
							'is-open': isOpen,
						} ) }
					>
						<Collapsible.Trigger
							className={ `${ baseCssClass }__trigger` }
						>
							<span className={ `${ baseCssClass }__label` }>
								{ category.label }
							</span>
							<Icon icon={ isOpen ? chevronUp : chevronDown } />
						</Collapsible.Trigger>
						<Collapsible.Panel
							className={ `${ baseCssClass }__panel` }
						>
							<MediaCategoryPanel
								rootClientId={ rootClientId }
								onInsert={ onInsert }
								category={ category }
							/>
						</Collapsible.Panel>
					</Collapsible.Root>
				);
			} ) }
			{ footer && (
				<div className={ `${ baseCssClass }__footer` }>{ footer }</div>
			) }
		</div>
	);
}
