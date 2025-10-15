/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { backgroundColor, progressColor, height, position, isInverted } =
		attributes;
	const blockProps = useBlockProps.save();

	const readProgressStyle = {
		backgroundColor,
		height: height + 'px',
	};

	const progressStyle = {
		backgroundColor: progressColor,
		height: height + 'px',
		transformOrigin: isInverted ? '100% 50%' : '0 50%',
	};

	if ( position === 'bottom' ) {
		readProgressStyle.top = 'auto';
		progressStyle.top = 'auto';
		readProgressStyle.bottom = 0;
		progressStyle.bottom = 0;
	}

	return (
		<div { ...blockProps }>
			<div className="wp-block-read-progress__container">
				<div
					style={ readProgressStyle }
					className="wp-block-read-progress__read-bar"
				>
					<div
						style={ progressStyle }
						className="wp-block-read-progress__progress-style"
					></div>
				</div>
			</div>
		</div>
	);
}
