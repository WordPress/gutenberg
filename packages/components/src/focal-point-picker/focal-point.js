/**
 * Internal dependencies
 */
import {
	FocalPointWrapper,
	PointerIconPathFill,
	PointerIconPathOutline,
	PointerIconSVG,
} from './styles/focal-point-style';

/**
 * External dependencies
 */
import classnames from 'classnames';

export default function FocalPoint( {
	coordinates = { left: '50%', top: '50%' },
	...props
} ) {
	const classes = classnames(
		'components-focal-point-picker__icon_container'
	);

	const style = {
		left: coordinates.left,
		top: coordinates.top,
	};

	return (
		<FocalPointWrapper { ...props } className={ classes } style={ style }>
			<PointerIconSVG
				className="components-focal-point-picker__icon"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 30 30"
			>
				<PointerIconPathOutline
					className="components-focal-point-picker__icon-outline"
					d="M15 1C7.3 1 1 7.3 1 15s6.3 14 14 14 14-6.3 14-14S22.7 1 15 1zm0 22c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
				/>
				<PointerIconPathFill
					className="components-focal-point-picker__icon-fill"
					d="M15 3C8.4 3 3 8.4 3 15s5.4 12 12 12 12-5.4 12-12S21.6 3 15 3zm0 22C9.5 25 5 20.5 5 15S9.5 5 15 5s10 4.5 10 10-4.5 10-10 10z"
				/>
			</PointerIconSVG>
		</FocalPointWrapper>
	);
}
