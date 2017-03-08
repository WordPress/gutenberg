/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import {
	ImageAlignLeftIcon,
	ImageAlignCenterIcon,
	ImageAlignRightIcon,
	ImageFullWidthIcon
} from 'dashicons';

export default class FigureAlignmentToolbar extends Component {
	onClick = ( id ) => () => {
		const newValue = id === this.props.value ? 'no-align' : id;
		this.props.onChange( newValue );
	};

	render() {
		const { value } = this.props;
		const alignments = [
			{ id: 'align-left', icon: ImageAlignLeftIcon },
			{ id: 'align-center', icon: ImageAlignCenterIcon },
			{ id: 'align-right', icon: ImageAlignRightIcon },
			{ id: 'align-full-width', icon: ImageFullWidthIcon },
		];

		return (
			<div className="block-list__block-toolbar">
				{ alignments.map( ( { id, icon: Icon } ) =>
					<button
						key={ id }
						onClick={ this.onClick( id ) }
						className={ classNames( 'block-list__block-control', {
							'is-selected': value === id
						} ) }
					>
						<Icon />
					</button>
				) }
			</div>
		);
	}
}
