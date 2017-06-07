/**
 * WordPress dependencies
 */
import { registerExtension } from 'extensions';
import { Component, cloneElement } from 'element';

/**
 * Internal dependencies
 */
import VisualEditorBlock from '../../modes/visual-editor/block';
import Layout from '../../layout';

registerExtension( 'wide-align', {
	decorators: [
		[ Layout, ( WrappedComponent ) => (
			class extends Component {
				componentDidMount() {
					this.props.setExtensionState( {
						layoutWidth: this.node.clientWidth,
					} );
				}

				render() {
					return (
						<div ref={ ( node ) => this.node = node }>
							<WrappedComponent { ...this.props } />
						</div>
					);
				}
			}
		) ],
		[ VisualEditorBlock, ( WrappedComponent ) => (
			class extends Component {
				render() {
					const { block, extensionState } = this.props;
					const { align } = block.attributes;
					const element = <WrappedComponent { ...this.props } />;
					if ( 'wide' !== align ) {
						return element;
					}

					const { layoutWidth } = extensionState;
					const offset = ( ( layoutWidth / -2 ) + ( 668 / 2 ) );
					return cloneElement( element, {
						style: {
							marginLeft: offset,
							marginRight: offset,
						},
					} );
				}
			}
		) ],
	],
} );
