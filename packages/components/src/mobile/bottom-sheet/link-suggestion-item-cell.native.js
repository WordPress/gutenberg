/**
 * External dependencies
 */
import { Text, View, StyleSheet } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList, globe, page } from '@wordpress/icons';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import cellStyles from './styles.scss';
import {
  itemContainerStyle,
  suggestionTitleStyle,
  suggestionSummaryStyle,
  suggestionContainerStyle,
  hidden,
} from './link-suggestion-styles.scss'

const { compose } = StyleSheet;

const icons = {
  URL: globe,
	post: postList,
	page: page,
};

// we use some Cell styles here with a column flex-direction
function LinkSuggestionItemCell( {
  suggestion,
  onLinkPicked,
  getStylesFromColorScheme,
} ) {
  const { title: contentTitle, url, type, isDirectEntry } = suggestion;
  const title = isDirectEntry ? url : contentTitle;
  const summary = isDirectEntry ? __( 'Add this link' ) : url;

  const pickLink = () => onLinkPicked( suggestion );

  const cellTitleStyle = getStylesFromColorScheme(
    cellStyles.cellLabel,
    cellStyles.cellTextDark
  );

  const cellSummaryStyle = getStylesFromColorScheme(
    cellStyles.cellValue,
    cellStyles.cellTextDark
  );

  const titleStyle = compose( cellTitleStyle, suggestionTitleStyle );
  const summaryStyle = compose( cellSummaryStyle, suggestionSummaryStyle );

	return (
    <Cell
      icon={ icons[ type ] }
      onPress={ pickLink }
      separatorType={ 'none' }
      cellContainerStyle={ itemContainerStyle }
      labelStyle={ hidden }
      valueStyle={ hidden }
    >
      <View style={ suggestionContainerStyle } >
        <Text
          style={ titleStyle }
          numberOfLines={ 1 }
          ellipsizeMode={ 'middle' }
        >
          { title }
        </Text>
				<Text
					style={ summaryStyle }
					numberOfLines={ 1 }
					ellipsizeMode={ 'middle' }
				>
					{ summary }
				</Text>
      </View>
    </Cell>
	);
}

export default withPreferredColorScheme( LinkSuggestionItemCell );