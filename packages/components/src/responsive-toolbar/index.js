/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, cloneElement, Children, createRef } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';
import Dropdown from '../dropdown';
import Disabled from '../disabled';

/**
 * Module constants
 */
const OFFSET = 60;

class ResponsiveToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			countHiddenChildren: 0,
		};
		this.container = createRef();
		this.hiddenContainer = createRef();

		this.throttledUpdateHiddenItems = this.throttledUpdateHiddenItems.bind( this );
	}

	componentDidMount() {
		this.toggleWindowEvents( true );
		this.updateHiddenItems();
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.children !== this.props.children ) {
			this.updateHiddenItems();
		}
	}

	componentWillUnmount() {
		this.toggleWindowEvents( false );
	}

	toggleWindowEvents( isListening ) {
		const handler = isListening ? 'addEventListener' : 'removeEventListener';

		window.cancelAnimationFrame( this.rafHandle );
		window[ handler ]( 'resize', this.throttledUpdateHiddenItems );
		window[ handler ]( 'scroll', this.throttledUpdateHiddenItems, true );
	}

	throttledUpdateHiddenItems() {
		this.rafHandle = window.requestAnimationFrame( () => this.updateHiddenItems() );
	}

	updateHiddenItems() {
		const { instanceId } = this.props;
		const containerRect = this.container.current.getBoundingClientRect();
		let countHiddenChildren = 0;
		const total = this.hiddenContainer.current.childNodes.length;
		this.hiddenContainer.current.childNodes.forEach( ( child ) => {
			const childRect = child.getBoundingClientRect();
			if (
				childRect.left < containerRect.left ||
				childRect.right > containerRect.right - OFFSET
			) {
				countHiddenChildren++;
			}
		} );

		if ( countHiddenChildren !== this.state.countHiddenChildren ) {
			this.setState( {
				countHiddenChildren,
			} );

			if ( this.style ) {
				this.style.parentNode.removeChild( this.style );
			}
			const styleNode = document.createElement( 'style' );
			styleNode.innerHTML = `
				#responsive-toolbar-${ instanceId } > *:nth-child(n+${ total - countHiddenChildren + 2 }):not(.components-responsive-toolbar__dropdown) {
					display: none;
				}

				.components-responsive-toolbar__dropdown-content-${ instanceId } .components-popover__content > *:nth-child(-n+${ total - countHiddenChildren }) {
					display: none;
				}
			`;
			document.body.appendChild( styleNode );
			this.style = styleNode;
		}
	}

	render() {
		const defaultRenderToggle = ( { onToggle, isOpen } ) => (
			<IconButton
				icon="arrow-down-alt2"
				onClick={ onToggle }
				aria-expanded={ isOpen }
			/>
		);
		const {
			children,
			instanceId,
			className,
			extraContentClassName,
			renderToggle = defaultRenderToggle,
			...props
		} = this.props;
		const { countHiddenChildren } = this.state;

		return (
			<div
				id={ `responsive-toolbar-${ instanceId }` }
				className={ classnames( className, 'components-responsive-toolbar' ) }
				ref={ this.container }
				{ ...props }
			>
				<Disabled>
					<div className="components-responsive-toolbar__compute-position" ref={ this.hiddenContainer }>
						{ children }
					</div>
				</Disabled>

				{ Children.map( children, ( child, index ) => {
					return cloneElement( child, { key: index } );
				} ) }

				{ countHiddenChildren > 0 && (
					<Dropdown
						noArrow
						position="bottom left"
						className="components-responsive-toolbar__dropdown"
						contentClassName={ classnames(
							extraContentClassName,
							`components-responsive-toolbar__dropdown-content-${ instanceId }` )
						}
						renderToggle={ renderToggle }
						renderContent={ () => {
							return Children.map( children, ( child, index ) => {
								return cloneElement( child, { key: index } );
							} );
						} }
					/>
				) }
			</div>
		);
	}
}

export default withInstanceId( ResponsiveToolbar );
