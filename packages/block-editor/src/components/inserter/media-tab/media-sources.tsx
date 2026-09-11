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
 * column. At most one is open at a time and fills the height left beneath
 * the other panels' headers; the first opens on mount, so the tab opens
 * straight onto a browsable library rather than a list of sources to drill
 * into.
 */
export default function MediaSources( {
	categories,
	onInsert,
	footer,
}: MediaSourcesProps ) {
	const [ openName, setOpenName ] = useState< string | undefined >(
		categories[ 0 ]?.name
	);
	const baseCssClass = 'block-editor-inserter__media-sources';

	return (
		<div className={ baseCssClass }>
			{ categories.map( ( category ) => {
				const isOpen = category.name === openName;
				return (
					<Collapsible.Root
						key={ category.name }
						open={ isOpen }
						onOpenChange={ ( open ) => {
							// Opening a panel closes the current one; closing
							// the open one leaves every panel collapsed.
							setOpenName( open ? category.name : undefined );
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
