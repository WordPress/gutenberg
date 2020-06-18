/**
 * Internal dependencies
 */
import SelectionBox from '../';

export default { title: 'Components/SelectionBox' };

export const _default = () => {
	return (
		<div
			className="parent"
			style={ {
				border: '2px solid black',
				width: 600,
				height: 400,
				overflowY: 'scroll',
			} }
		>
			<div
				style={ {
					height: 4000,
					position: 'relative',
				} }
			>
				<SelectionBox boundariesElement=".parent" />
			</div>
		</div>
	);
};
