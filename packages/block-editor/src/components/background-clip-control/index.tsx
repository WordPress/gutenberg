import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

interface BackgroundClipItem {
	value: string;
	label: string;
}

const BACKGROUND_CLIP_ITEMS: BackgroundClipItem[] = [
	{ value: 'border-box', label: __( 'Border box' ) },
	{ value: 'padding-box', label: __( 'Padding box' ) },
	{ value: 'content-box', label: __( 'Content box' ) },
	{ value: 'text', label: __( 'Text' ) },
];

const DEFAULT_ITEM: BackgroundClipItem = {
	value: 'default',
	label: __( 'Default' ),
};

interface BackgroundClipControlProps {
	value?: string;
	onChange: ( value?: string ) => void;
	allowedValues?: string[];
}

export default function BackgroundClipControl( {
	value,
	onChange,
	allowedValues,
}: BackgroundClipControlProps ) {
	const items = allowedValues
		? BACKGROUND_CLIP_ITEMS.filter( ( item ) =>
				allowedValues.includes( item.value )
			)
		: BACKGROUND_CLIP_ITEMS;

	if ( ! items.length ) {
		return null;
	}

	const visibleItems = [ DEFAULT_ITEM, ...items ];
	const selectedItem =
		items.find( ( item ) => item.value === value ) ?? DEFAULT_ITEM;

	return (
		<SelectControl
			className="block-editor-background-clip-control"
			label={ __( 'Clip' ) }
			items={ visibleItems }
			value={ selectedItem }
			onValueChange={ ( item ) => {
				if (
					! item ||
					item.value === DEFAULT_ITEM.value ||
					item.value === null
				) {
					onChange( undefined );
				} else {
					onChange( item.value );
				}
			} }
		>
			{ visibleItems.map( ( item ) => (
				<SelectControl.Item
					key={ item.value }
					value={ item }
					label={ item.label }
					className={ `block-editor-background-clip-control__option is-${ item.value }` }
				>
					<SelectControl.ItemLabel>
						{ item.label }
					</SelectControl.ItemLabel>
				</SelectControl.Item>
			) ) }
		</SelectControl>
	);
}
