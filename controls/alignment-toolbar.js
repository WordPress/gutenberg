import classNames from 'classnames';
import {
	EditorAlignLeftIcon,
	EditorAlignCenterIcon,
	EditorAlignRightIcon
} from './dashicons';

export default class AlignmentToolbar extends wp.element.Component {

	render() {
		const { value, actions } = this.props;
		const alignments = [
			{ id: 'left', icon: EditorAlignLeftIcon },
			{ id: 'center', icon: EditorAlignCenterIcon },
			{ id: 'right', icon: EditorAlignRightIcon }
		];
		const selectedTextAlign = value || 'left';

		return (
			<div className="block-list__block-toolbar">
				{ alignments.map( ( { id, icon: Icon } ) =>
					<button
						key={ id }
						className={ classNames( 'block-list__block-control', {
							'is-selected': selectedTextAlign === id
						} ) }
						onClick={ actions[ id ] }
					>
						<Icon />
					</button>
				) }
			</div>
		);
	}
}

AlignmentToolbar.propTypes = {
	actions: wp.element.PropTypes.shape( {
		left: wp.element.PropTypes.func,
		center: wp.element.PropTypes.func,
		right: wp.element.PropTypes.func,
	} )
};
