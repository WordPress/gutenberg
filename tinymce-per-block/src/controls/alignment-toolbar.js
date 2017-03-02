/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import {
	EditorAlignLeftIcon,
	EditorAlignCenterIcon,
	EditorAlignRightIcon
} from 'dashicons';

export default class AlignmentToolbar extends Component {
	onClick = ( id ) => () => {
		this.props.onChange( id );
	};

	render() {
		const { value } = this.props;
		const alignments = [
			{ id: 'left', icon: EditorAlignLeftIcon },
			{ id: 'center', icon: EditorAlignCenterIcon },
			{ id: 'right', icon: EditorAlignRightIcon }
		];
		const selectedTextAlign = value || 'left';

		return (
			<div className="block-list__block-toolbar">
				{ alignments.map( ( { id, icon: Icon } ) =>
					<button
						key={ id }
						onClick={ this.onClick( id ) }
						className={ classNames( 'block-list__block-control', {
							'is-selected': selectedTextAlign === id
						} ) }
					>
						<Icon />
					</button>
				) }
			</div>
		);
	}
}
