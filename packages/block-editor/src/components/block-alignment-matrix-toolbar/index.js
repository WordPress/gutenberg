/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Toolbar,
	__experimentalAlignmentMatrixControl as AlignmentMatrixControl,
} from '@wordpress/components';

const POPOVER_PROPS = {
	className: 'block-editor-block-alignment-matrix-toolbar',
	position: 'bottom right',
};

export function BlockAlignmentMatrixToolbar( props ) {
	const {
		isCollapsed = true,
		label = __( 'Change matrix alignment' ),
		onChange = noop,
		value = 'center',
	} = props;

	const icon = <AlignmentMatrixControl.Icon value={ value } />;

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ icon }
			label={ label }
			popoverProps={ POPOVER_PROPS }
		>
			{ () => {
				return (
					<AlignmentMatrixControl
						hasFocusBorder={ false }
						onChange={ onChange }
						value={ value }
					/>
				);
			} }
		</Toolbar>
	);
}

export default BlockAlignmentMatrixToolbar;
