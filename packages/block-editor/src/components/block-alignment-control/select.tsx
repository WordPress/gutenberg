import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { SelectControl } from '@wordpress/ui';
import { useAlignmentMenu } from './use-available-alignments';
import { BLOCK_ALIGNMENTS_CONTROLS, DEFAULT_CONTROL } from './constants';

interface BlockAlignmentSelectProps {
	/** The current alignment. */
	value?: string;
	/** Called with the next alignment, or `undefined` for none. */
	onChange: ( value?: string ) => void;
	/** The alignments the block supports. */
	controls?: string[];
}

interface AlignmentItem {
	value: string;
	label: string;
	icon: JSX.Element;
	description?: string;
	disabled?: boolean;
}

/**
 * The block alignment as a select, for the inspector's Layout panel.
 *
 * The toolbar control is curated away from blocks whose toolbar is about text
 * rather than layout, so for those this is the only place the alignment can be
 * set. It carries the same icons, labels and help text as the toolbar menu,
 * including listing the wide alignments a parent layout withholds as
 * unavailable.
 */
export default function BlockAlignmentSelect( {
	value,
	onChange,
	controls,
}: BlockAlignmentSelectProps ) {
	const { enabled, unavailable } = useAlignmentMenu( controls );

	// A select of nothing but unavailable options could never change anything.
	if ( ! enabled.length ) {
		return null;
	}

	const items: AlignmentItem[] = enabled.map(
		( { name, info }: { name: string; info?: string } ) => ( {
			value: name,
			label: BLOCK_ALIGNMENTS_CONTROLS[ name ].title,
			icon: BLOCK_ALIGNMENTS_CONTROLS[ name ].icon,
			description: info,
		} )
	);

	// Unavailable alignments sit where they would have sat had they been
	// offered, which is directly after `none`.
	items.splice(
		items.findIndex( ( item ) => item.value === DEFAULT_CONTROL ) + 1,
		0,
		...unavailable.map( ( name: string ) => ( {
			value: name,
			label: BLOCK_ALIGNMENTS_CONTROLS[ name ].title,
			icon: BLOCK_ALIGNMENTS_CONTROLS[ name ].icon,
			description: __( 'Not available' ),
			disabled: true,
		} ) )
	);

	/*
	 * An alignment a parent layout has taken away can still be the saved value.
	 * Showing it as selected is how the select says the setting exists but has
	 * no effect in this position, so look through the unavailable items too.
	 */
	const selected =
		items.find( ( item ) => item.value === value ) ??
		items.find( ( item ) => item.value === DEFAULT_CONTROL );

	return (
		<SelectControl
			label={ __( 'Alignment' ) }
			items={ items }
			value={ selected }
			onValueChange={ ( item ) =>
				onChange(
					! item || item.value === DEFAULT_CONTROL
						? undefined
						: ( item.value as string )
				)
			}
			popupWidth="anchor"
		>
			{ items.map( ( item ) => (
				<SelectControl.Item
					key={ item.value }
					value={ item }
					label={ item.label }
					disabled={ item.disabled }
				>
					<SelectControl.ItemLabel>
						<span className="block-editor-block-alignment-control__item-label">
							<Icon icon={ item.icon } size={ 24 } />
							{ item.label }
						</span>
					</SelectControl.ItemLabel>
					{ item.description ? (
						<SelectControl.ItemDescription>
							{ item.description }
						</SelectControl.ItemDescription>
					) : null }
				</SelectControl.Item>
			) ) }
		</SelectControl>
	);
}
