/**
 * Internal dependencies
 */
import MissingCell from '../mobile/bottom-sheet/missing-cell';

function MissingControl( {
	label,
	help,
	instanceId,
	className,
	...props
} ) {
	const id = `inspector-missing-control-${ instanceId }`;

	return (
		<MissingCell
			label={ label }
			id={ id }
			help={ help }
			className={ className }
			aria-describedby={ !! help ? id + '__help' : undefined }
			{ ...props }
		/>
	);
}

export default MissingControl;
