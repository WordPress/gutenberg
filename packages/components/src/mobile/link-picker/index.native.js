/**
 * External dependencies
 */
import { useState } from 'react';
import { View } from 'react-native';
import { startsWith } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { link } from '@wordpress/icons';
import { BottomSheet, } from '@wordpress/components';
import { getProtocol, prependHTTP } from '@wordpress/url';

/**
 * Internal dependencies
 */
import LinkPickerResults from './link-picker-results';
import NavigationHeader from '../bottom-sheet/navigation-header';

// this creates a search suggestion for adding a url directly
export const createDirectEntry = ( value ) => {
	let type = 'URL';

	const protocol = getProtocol( value ) || '';

	if ( protocol.includes( 'mailto' ) ) {
		type = 'mailto';
	}

	if ( protocol.includes( 'tel' ) ) {
		type = 'tel';
	}

	if ( startsWith( value, '#' ) ) {
		type = 'internal';
	}

	return {
		isDirectEntry: true,
		title: value,
		url: type === 'URL' ? prependHTTP( value ) : value,
		type,
	};
};

export const LinkPicker = ( {
  value: initialValue,
  onLinkPicked,
  onCancel: cancel,
} ) => {
  const [ value, setValue ] = useState( initialValue );
  const directEntry = createDirectEntry( value );

  // the title of a direct entry is displayed as the raw input value, but if we
  // are replacing empty text, we want to use the generated url
  const pickLink = ( { title, url, isDirectEntry } ) => {
    onLinkPicked( { title: isDirectEntry ? url : title, url } );
  };

  const onSubmit = () => pickLink( directEntry );
  
  return (
    <View>
      <NavigationHeader
        screen={ __( 'Add URL' ) }
        leftButtonOnPress={ cancel }
      />
      <BottomSheet.Cell
        icon={ link }
        label={ __( 'URL' ) }
        value={ value }
        placeholder={ __( 'Search or type URL' ) }
        autoCapitalize="none"
        autoCorrect={ false }
        keyboardType="url"
        onChangeValue={ setValue }
        onSubmit={ onSubmit }
        /* eslint-disable-next-line jsx-a11y/no-autofocus */
        autoFocus={ true }
      />
      { !! value && (
        <LinkPickerResults
          query={ value }
          onLinkPicked={ pickLink }
          directEntry={ directEntry }
        />
      ) }
    </View>
  );
}
