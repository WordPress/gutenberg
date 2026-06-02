/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const {
		label,
		value,
		max = 100,
		backgroundColor,
		progressColor,
		height,
		showValue,
		symbol,
		symbolPosition,
		showTotal,
		seprator,
	} = attributes;

	// eslint-disable-next-line react-compiler/react-compiler
	const blockProps = useBlockProps.save( {
		className: 'wp-block-progress-meter',
	} );

	const progressBarStyle = {
		backgroundColor,
		height: `${ height }px`,
	};

	const progressStyle = {
		backgroundColor: progressColor,
		width: `${ ( value / max ) * 100 }%`,
	};

	const formatValue = ( val ) => {
		return symbolPosition === 'prefix'
			? `${ symbol }${ val }`
			: `${ val }${ symbol }`;
	};

	const valueDisplay = showTotal
		? `${ formatValue( value ) } ${ seprator } ${ formatValue( max ) }`
		: formatValue( value );

	return (
		<div { ...blockProps }>
			<div className="wp-block-progress-meter__container">
				<div>
					<RichText.Content
						tagName="p"
						className="wp-block-progress-meter__label"
						value={ label }
					/>
					{ showValue && <p>{ valueDisplay }</p> }
				</div>

				<div
					style={ progressBarStyle }
					className="wp-block-progress-meter__bar"
				>
					<div
						style={ progressStyle }
						className="wp-block-progress-meter__progress"
					></div>
				</div>
			</div>
		</div>
	);
}
