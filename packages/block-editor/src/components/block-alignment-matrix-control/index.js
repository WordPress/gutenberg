/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';
import {
	ToolbarButton,
	Dropdown,
	__experimentalAlignmentMatrixControl as AlignmentMatrixControl,
} from '@wordpress/components';

function BlockAlignmentMatrixControl( props ) {
	const {
		label = __( 'Change matrix alignment' ),
		onChange = noop,
		value = 'center',
		isDisabled,
	} = props;

	const icon = <AlignmentMatrixControl.Icon value={ value } />;
	const className = 'block-editor-block-alignment-matrix-control';
	const popoverClassName = `${ className }__popover`;
	const isAlternate = true;

	return (
		<Dropdown
			position="bottom right"
			className={ className }
			popoverProps={ { className: popoverClassName, isAlternate } }
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
					<ToolbarButton
						onClick={ onToggle }
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onKeyDown={ openOnArrowDown }
						label={ label }
						icon={ icon }
						showTooltip
						disabled={ isDisabled }
					/>
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

export default BlockAlignmentMatrixControl;
