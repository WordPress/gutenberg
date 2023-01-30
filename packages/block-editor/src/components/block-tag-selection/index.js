/**
 * WordPress dependencies
 */
import { ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TagIcon from './tag-icon';

// Default HTML tags
const DEFAULT_TAGS = [
	{
		tag: 'h1',
		title: __( 'Heading 1' ),
	},
	{
		tag: 'h2',
		title: __( 'Heading 2' ),
	},
	{
		tag: 'h3',
		title: __( 'Heading 3' ),
	},
	{
		tag: 'h4',
		title: __( 'Heading 4' ),
	},
	{
		tag: 'h5',
		title: __( 'Heading 5' ),
	},
	{
		tag: 'h6',
		title: __( 'Heading 6' ),
	},
];

const POPOVER_PROPS = {
	className: 'block-editor-block-tag-selection',
};

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * TagSelectionDropdown props.
 *
 * @typedef WPTagSelectionDropdownProps
 *
 * @property {Array}  tags        The list of available HTML tags.
 * @property {string} selectedTag The chosen HTML tag.
 * @property {string} onChange    Callback to run when
 *                                toolbar value is changed.
 */

/**
 * Dropdown for selecting a HTML tag.
 *
 * @param {WPTagSelectionDropdownProps} props Component props.
 *
 * @return {WPComponent} The toolbar.
 */
export default function TagSelectionDropdown( {
	tags,
	selectedTag,
	onChange,
} ) {
	const tagslist = tags ? tags : DEFAULT_TAGS;

	return (
		<ToolbarDropdownMenu
			popoverProps={ POPOVER_PROPS }
			icon={ <TagIcon tag={ selectedTag } /> }
			label={ __( 'Change HTML tag' ) }
			controls={ tagslist.map( ( targetTag ) => {
				{
					const isActive = targetTag.tag === selectedTag;
					return {
						icon: (
							<TagIcon
								tag={ targetTag.tag }
								isPressed={ isActive }
							/>
						),
						title: targetTag.title,
						isActive,
						onClick() {
							onChange( targetTag.tag );
						},
						role: 'menuitemradio',
					};
				}
			} ) }
		/>
	);
}
