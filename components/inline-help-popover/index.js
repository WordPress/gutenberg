/**
 * External dependencies
 */
import classnames from 'classnames';
import clickOutside from 'react-click-outside';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import Popover from '../popover';

export class InlineHelpPopover extends Component {
	constructor() {
		super();
		this.state = {
			showPopover: false,
		};
		this.togglePopover = this.togglePopover.bind( this );
		this.handleClickOutside = this.handleClickOutside.bind( this );
	}

	togglePopover( event ) {
		event.stopPropagation();
		this.setState( {
			showPopover: ! this.state.showPopover,
		} );
	}

	handleClickOutside() {
		this.setState( {
			showPopover: false,
		} );
	}

	render() {
		const {
			className,
			text,
			popoverPosition = 'bottom right',
			popoverText,
			popoverClassName,
		} = this.props;

		const rootClasses = classnames(
			'inline-help-popover',
			className
		);
		const popoverClasses = classnames(
			'inline-help-popover__popover',
			popoverClassName
		);

		return (
			<span className={ rootClasses }>
				<Button
					onClick={ this.togglePopover }
					aria-expanded={ this.state.showPopover }
				>
					{ text }
				</Button>
				{ this.state.showPopover && (
					<Popover
						className={ popoverClasses }
						position={ popoverPosition }
					>
						{ popoverText }
					</Popover>
				) }
			</span>
		);
	}
}

export default clickOutside( InlineHelpPopover );
