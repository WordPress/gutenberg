/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import PatternSelection, { useBlockPatterns } from './pattern-selection';
import { unlock } from '../../lock-unlock';

function PatternPicker( { clientId, attributes, hasInnerBlocks } ) {
	const hasPatterns = useBlockPatterns( clientId, attributes ).length;
	if ( ! hasPatterns ) {
		return null;
	}
	const buttonLabel = hasInnerBlocks
		? __( 'Change design' )
		: __( 'Choose pattern' );
	return (
		<BlockControls group="other">
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
		</BlockControls>
	);
}

export default function QueryToolbar( props ) {
	const isLocked = useSelect(
		( select ) => {
			const { isLockedBlock } = unlock( select( blockEditorStore ) );
			return isLockedBlock( props.clientId );
		},
		[ props.clientId ]
	);
	if ( isLocked ) {
		return null;
	}
	return <PatternPicker { ...props } />;
}
