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
const DEFAULT_TAGS = [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ];

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
					const isActive = targetTag === selectedTag;
					return {
						icon: (
							<TagIcon tag={ targetTag } isPressed={ isActive } />
						),
						label: targetTag,
						isActive,
						onClick() {
							onChange( targetTag );
						},
						role: 'menuitemradio',
					};
				}
			} ) }
		/>
	);
}
