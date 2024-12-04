/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	ToolbarButton,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PatternSelection, { useBlockPatterns } from './pattern-selection';

const POPOVER_PROPS = {
	placement: 'bottom-start',
};

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
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			expandOnMobile
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarGroup>
					<ToolbarButton
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ buttonLabel }
					</ToolbarButton>
				</ToolbarGroup>
			) }
			renderContent={ () => (
				<DropdownContentWrapper
					className="block-library-query__toolbar-popover-content-wrapper"
					paddingSize="none"
				>
					<PatternSelection
						clientId={ clientId }
						attributes={ attributes }
						showSearch={ false }
						showTitlesAsTooltip
					/>
				</DropdownContentWrapper>
			) }
		/>
	);
}
