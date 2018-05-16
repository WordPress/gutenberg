/**
 * Internal dependencies
 */
import './style.scss';

export default function InlineInsertionPoint( { style } ) {
	return (
		<div
			style={ { position: 'absolute', ...style } }
			className="blocks-inline-insertion-point"
		>
			<div className="blocks-inline-insertion-point__caret" />
			<div className="blocks-inline-insertion-point__indicator" />
		</div>
	);
}
