/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	render() {
		const {
			hasBlockTypes,
			position,
			title,
			children,
		} = this.props;

		if ( ! hasBlockTypes ) {
			return null;
		}

		return (
			<Dropdown
				className="editor-inserter"
				contentClassName="editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ title }
				renderToggle={ ( { onToggle, isOpen } ) => (
					<IconButton
						icon="insert"
						label={ __( 'Add block' ) }
						onClick={ onToggle }
						className="editor-inserter__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
					>
						{ children }
					</IconButton>
				) }
				renderContent={ ( { onClose } ) => {
					return <InserterMenu onClose={ onClose } />;
				} }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockTypes,
		} = select( 'core/blocks' );
		const {
			getEditedPostAttribute,
		} = select( 'core/editor' );
		return {
			hasBlockTypes: getBlockTypes().length > 0,
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
] )( Inserter );
