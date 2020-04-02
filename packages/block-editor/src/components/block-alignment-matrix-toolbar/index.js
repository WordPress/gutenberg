/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	__experimentalAlignmentMatrixControl as AlignmentMatrixControl,
} from '@wordpress/components';

export function BlockAlignmentMatrixToolbar( props ) {
	const {
		label = __( 'Change matrix alignment' ),
		onChange = noop,
		value = 'center',
	} = props;

	const icon = <AlignmentMatrixControl.Icon value={ value } />;
	const className = 'block-editor-block-alignment-matrix-toolbar';

	return (
		<Dropdown
			position="bottom right"
			className={ className }
			popoverProps={ { className } }
			renderToggle={ ( { onToggle, isOpen } ) => {
				return (
					<ToolbarGroup>
						<ToolbarButton
							onClick={ onToggle }
							aria-haspopup="true"
							aria-expanded={ isOpen }
							label={ label }
							icon={ icon }
							showTooltip
						/>
					</ToolbarGroup>
				);
			} }
			renderContent={ () => (
				<AlignmentMatrixControl
					hasFocusBorder={ false }
					onChange={ onChange }
					value={ value }
				/>
			) }
		/>
	);
}

export default BlockAlignmentMatrixToolbar;
