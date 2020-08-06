/**
 * Internal dependencies
 */
import FooterMessageCell from '../mobile/bottom-sheet/footer-message-cell';

function FooterMessageControl( {
	label,
	help,
	instanceId,
	className,
	...props
} ) {
	const id = `inspector-footer-message-control-${ instanceId }`;

	return (
		<FooterMessageCell
			label={ label }
			id={ id }
			help={ help }
			className={ className }
			aria-describedby={ !! help ? id + '__help' : undefined }
			{ ...props }
		/>
	);
}

export default FooterMessageControl;
