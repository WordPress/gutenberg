/**
 * External dependencies
 */
import { Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, Children, cloneElement } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './body.scss';

export class PanelBody extends Component {
	constructor() {
		super( ...arguments );
		this.state = {};
	}

	render() {
		const {
			children = [],
			title,
			separatorType,
			lastSeparatorType = 'none',
			style = {},
		} = this.props;
		// Filter children since sometimes it includes undefined which is cause of a crash in cloneElement.
		const filteredChildren = Array.isArray( children )
			? children.filter( ( child ) => !! child )
			: [ children ];
		return (
			<View style={ [ styles.panelContainer, style ] }>
				{ title && (
					<Text style={ styles.sectionHeaderText }>{ title }</Text>
				) }
				{ /* Set correct separator for each child. */ }
				{ Children.map( filteredChildren, ( child, index ) => {
					return cloneElement( child, {
						separatorType:
							child.props.separatorType ||
							( index !== filteredChildren.length - 1
								? separatorType
								: lastSeparatorType ),
					} );
				} ) }
			</View>
		);
	}
}

export default PanelBody;
