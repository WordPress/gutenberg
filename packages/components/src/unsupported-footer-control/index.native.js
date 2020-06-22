/**
 * Internal dependencies
 */
import UnsupportedFooterCell from '../mobile/bottom-sheet/unsupported-footer-cell';

function UnsupportedFooterControl( {
	label,
	help,
	instanceId,
	className,
	...props
} ) {
	const id = `inspector-unsupported-footer-control-${ instanceId }`;

	return (
		<UnsupportedFooterCell
			label={ label }
			id={ id }
			help={ help }
			className={ className }
			aria-describedby={ !! help ? id + '__help' : undefined }
			{ ...props }
		/>
	);
}

export default UnsupportedFooterControl;
