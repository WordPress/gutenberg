/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalInputControl as InputControl,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { MediaEdit } from '@wordpress/fields';

// Custom Edit component for text fields that renders the description using
// <Text variant="muted"> to match how MediaEdit renders descriptions.
// The built-in DataForm text control renders descriptions via InputControl's
// `help` prop, which produces a smaller font size than MediaEdit's description.
function TextEdit( { data, field, onChange, hideLabelFromVision } ) {
	const value = field.getValue( { item: data } );
	const onChangeValue = useCallback(
		( newValue ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);

	return (
		<VStack spacing={ 2 }>
			<InputControl
				label={ field.label }
				hideLabelFromVision={ hideLabelFromVision }
				value={ value ?? '' }
				onChange={ onChangeValue }
				__next40pxDefaultSize
			/>
			{ field.description && (
				<Text variant="muted">{ field.description }</Text>
			) }
		</VStack>
	);
}

const fields = [
	{
		id: 'title',
		type: 'text',
		label: __( 'Site Title' ),
		description: __(
			"Displays in your site's layout via the Site Title block."
		),
		Edit: TextEdit,
	},
	{
		id: 'description',
		type: 'text',
		label: __( 'Site Tagline' ),
		description: __(
			"In a few words, explain what this site is about. Displays in your site's layout via the Site Tagline block."
		),
		Edit: TextEdit,
	},
	{
		id: 'site_logo',
		type: 'media',
		label: __( 'Site Logo' ),
		description: __(
			"Displays in your site's layout via the Site Logo block."
		),
		placeholder: __( 'Choose logo' ),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_logo: value ?? 0,
		} ),
	},
	{
		id: 'site_icon',
		type: 'media',
		label: __( 'Site Icon' ),
		description: __(
			'Shown in browser tabs, bookmarks, and mobile apps. It should be square and at least 512 by 512 pixels.'
		),
		placeholder: __( 'Choose icon' ),
		Edit: MediaEdit,
		setValue: ( { value } ) => ( {
			site_icon: value ?? 0,
		} ),
	},
];

const form = {
	layout: {
		type: 'regular',
		labelPosition: 'top',
	},
	fields: [ 'title', 'description', 'site_logo', 'site_icon' ],
};

export default function SidebarIdentity() {
	const data = useSelect(
		( select ) =>
			select( coreStore ).getEditedEntityRecord( 'root', 'site' ),
		[]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onChange = ( edits ) => {
		editEntityRecord( 'root', 'site', undefined, edits );
	};

	return (
		<Page title={ __( 'Identity' ) } hasPadding>
			<DataForm
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
		</Page>
	);
}
