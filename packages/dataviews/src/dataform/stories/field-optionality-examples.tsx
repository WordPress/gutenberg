/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataForm from '../index';
import type { Field, Form } from '../../types';

export function AllRequiredExample() {
	type User = {
		firstName: string;
		lastName: string;
		email: string;
	};

	const [ user, setUser ] = useState< User >( {
		firstName: '',
		lastName: '',
		email: '',
	} );

	const fields: Field< User >[] = [
		{
			id: 'firstName',
			label: 'First Name',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'lastName',
			label: 'Last Name',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
			isValid: { required: true },
		},
	];

	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'userInfo',
				label: 'User Information',
				description: 'All fields are required',
				layout: { type: 'card' },
				children: [ 'firstName', 'lastName', 'email' ],
			},
		],
	};

	return (
		<DataForm
			data={ user }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setUser( ( prev ) => ( { ...prev, ...edits } ) )
			}
		/>
	);
}

export function AllOptionalExample() {
	type Preferences = {
		newsletter: boolean;
		notifications: boolean;
		theme: string;
	};

	const [ preferences, setPreferences ] = useState< Preferences >( {
		newsletter: false,
		notifications: false,
		theme: '',
	} );

	const fields: Field< Preferences >[] = [
		{
			id: 'newsletter',
			label: 'Subscribe to newsletter',
			type: 'boolean',
		},
		{
			id: 'notifications',
			label: 'Enable notifications',
			type: 'boolean',
		},
		{
			id: 'theme',
			label: 'Preferred theme',
			type: 'text',
		},
	];

	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'userPreferences',
				label: 'Preferences',
				description: 'All fields are optional',
				layout: { type: 'card' },
				children: [ 'newsletter', 'notifications', 'theme' ],
			},
		],
	};

	return (
		<DataForm
			data={ preferences }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setPreferences( ( prev ) => ( { ...prev, ...edits } ) )
			}
		/>
	);
}

export function MostlyRequiredExample() {
	type Account = {
		username: string;
		email: string;
		password: string;
		bio: string;
		website: string;
	};

	const [ account, setAccount ] = useState< Account >( {
		username: '',
		email: '',
		password: '',
		bio: '',
		website: '',
	} );

	const fields: Field< Account >[] = [
		{
			id: 'username',
			label: 'Username',
			type: 'text',
			isValid: { required: true },
		},
		{
			id: 'email',
			label: 'Email',
			type: 'email',
			isValid: { required: true },
		},
		{
			id: 'password',
			label: 'Password',
			type: 'password',
			isValid: { required: true },
		},
		{
			id: 'bio',
			label: 'Bio',
			type: 'text',
			Edit: 'textarea',
			// Optional field - mark as optional
			isValid: { required: false },
			// Note: markWhenOptional support may require custom Edit component
			// or future DataForm enhancement
		},
		{
			id: 'website',
			label: 'Website',
			type: 'url',
			// Optional field - mark as optional
			isValid: { required: false },
		},
	];

	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'accountInfo',
				label: 'Account Information',
				layout: { type: 'card' },
				children: [ 'username', 'email', 'password', 'bio', 'website' ],
			},
		],
	};

	return (
		<DataForm
			data={ account }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setAccount( ( prev ) => ( { ...prev, ...edits } ) )
			}
		/>
	);
}

export function MostlyOptionalExample() {
	type Profile = {
		name: string;
		location: string;
		bio: string;
		interests: string;
		socialLinks: string;
	};

	const [ profile, setProfile ] = useState< Profile >( {
		name: '',
		location: '',
		bio: '',
		interests: '',
		socialLinks: '',
	} );

	const fields: Field< Profile >[] = [
		{
			id: 'name',
			label: 'Name',
			type: 'text',
			// Required field - mark as required
			isValid: { required: true },
		},
		{
			id: 'location',
			label: 'Location',
			type: 'text',
			// Optional - no marker needed
		},
		{
			id: 'bio',
			label: 'Bio',
			type: 'text',
			Edit: 'textarea',
			// Optional - no marker needed
		},
		{
			id: 'interests',
			label: 'Interests',
			type: 'text',
			// Optional - no marker needed
		},
		{
			id: 'socialLinks',
			label: 'Social Links',
			type: 'url',
			// Optional - no marker needed
		},
	];

	const form: Form = {
		layout: { type: 'card' },
		fields: [
			{
				id: 'profileInfo',
				label: 'Profile Information',
				layout: { type: 'card' },
				children: [
					'name',
					'location',
					'bio',
					'interests',
					'socialLinks',
				],
			},
		],
	};

	return (
		<DataForm
			data={ profile }
			fields={ fields }
			form={ form }
			onChange={ ( edits ) =>
				setProfile( ( prev ) => ( { ...prev, ...edits } ) )
			}
		/>
	);
}
