/**
 * External dependencies
 */
import { range } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

class HeadingToolbar extends Component {
	createLevelControl( targetLevel, selectedLevel, onChange ) {
		const isActive = targetLevel === selectedLevel;
		return {
			icon: <HeadingLevelIcon level={ targetLevel } isPressed={ isActive } />,
			// translators: %s: heading level e.g: "1", "2", "3"
			title: sprintf( __( 'Heading %d' ), targetLevel ),
			isActive,
			onClick: () => onChange( targetLevel ),
		};
	}

	render() {
		const { isCollapsed = true, minLevel, maxLevel, selectedLevel, onChange } = this.props;

		return (
			<ToolbarGroup
				isCollapsed={ isCollapsed }
				icon={ <HeadingLevelIcon level={ selectedLevel } /> }
				controls={ range( minLevel, maxLevel ).map(
					( index ) => this.createLevelControl( index, selectedLevel, onChange )
				) } />
		);
	}
}

export default HeadingToolbar;
