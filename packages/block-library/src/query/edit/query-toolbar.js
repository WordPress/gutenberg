/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternSelection, { useBlockPatterns } from './pattern-selection';

export default function QueryToolbar( {
	clientId,
	attributes,
	hasInnerBlocks,
} ) {
	const hasPatterns = useBlockPatterns( clientId, attributes ).length;
	if ( ! hasPatterns ) {
		return null;
	}

	const buttonLabel = hasInnerBlocks
		? __( 'Change design' )
		: __( 'Choose pattern' );

	return (
		<DropdownContentWrapper>
			<Dropdown
				contentClassName="block-editor-block-settings-menu__popover"
				focusOnMount="firstElement"
				expandOnMobile
				renderToggle={ ( { isOpen, onToggle } ) => (
					<ToolbarButton
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ buttonLabel }
					</ToolbarButton>
				) }
				renderContent={ () => (
					<PatternSelection
						clientId={ clientId }
						attributes={ attributes }
						showSearch={ false }
						showTitlesAsTooltip
					/>
				) }
			/>
		</DropdownContentWrapper>
	);
}
