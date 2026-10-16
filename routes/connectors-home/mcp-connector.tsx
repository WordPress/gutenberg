import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, copySmall } from '@wordpress/icons';
import {
	InputControl,
	InputLayout,
	Link,
	Notice,
	Spinner,
	Stack,
	Text,
} from '@wordpress/ui';

export interface ApplicationPasswordsData {
	isSupported: boolean;
	isAvailable: boolean;
	isAvailableForUser: boolean;
	canCreate: boolean;
	username: string;
	profileUrl: string;
}

export interface McpApplicationPassword {
	uuid: string;
	app_id: string;
	name: string;
	created: string;
	last_used: string | null;
}

interface RestNamespaceIndex {
	routes?: Record< string, { _links?: { self?: { href: string }[] } } >;
}

const DEFAULT_SERVER_ROUTE = '/mcp/mcp-adapter-default-server';
const APPLICATION_PASSWORDS_PATH = '/wp/v2/users/me/application-passwords';

// Marks the application passwords created on this card, so it can list them.
const MCP_APP_ID = '19cb6628-2ea1-436f-a865-dcc745478535';

/**
 * Reads the default MCP server URL from the REST API index, so it matches the
 * site's permalink and directory setup.
 *
 * @param isAdapterActive - Whether the MCP Adapter is active.
 * @return The URL, `undefined` while loading, `null` when not registered, or
 *         `false` when the REST API request failed.
 */
export function useMcpEndpoint( isAdapterActive: boolean ) {
	const [ endpoint, setEndpoint ] = useState< string | null | false >();

	useEffect( () => {
		if ( ! isAdapterActive ) {
			return;
		}
		let isMounted = true;
		apiFetch< RestNamespaceIndex >( { path: '/mcp' } )
			.then( ( index ) => {
				if ( isMounted ) {
					setEndpoint(
						index.routes?.[ DEFAULT_SERVER_ROUTE ]?._links
							?.self?.[ 0 ]?.href ?? null
					);
				}
			} )
			.catch( ( error: { code?: string } ) => {
				if ( isMounted ) {
					setEndpoint(
						error?.code === 'rest_no_route' ? null : false
					);
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [ isAdapterActive ] );

	return endpoint;
}

/**
 * Loads the current user's application passwords that were created on this
 * card.
 *
 * @param applicationPasswords - Application password availability for the current user.
 * @param isAdapterActive      - Whether the MCP Adapter is active.
 * @return The application passwords, newest first, or `undefined` while loading.
 */
export function useMcpApplicationPasswords(
	applicationPasswords: ApplicationPasswordsData | undefined,
	isAdapterActive: boolean
) {
	const [ passwords, setPasswords ] = useState< McpApplicationPassword[] >();
	const canLoad =
		isAdapterActive && ! getUnavailableMessage( applicationPasswords );

	useEffect( () => {
		if ( ! canLoad ) {
			return;
		}
		let isMounted = true;
		apiFetch< McpApplicationPassword[] >( {
			path: APPLICATION_PASSWORDS_PATH,
		} )
			.then( ( items ) =>
				items.filter( ( item ) => item.app_id === MCP_APP_ID ).reverse()
			)
			.catch( () => [] )
			.then( ( items ) => {
				if ( isMounted ) {
					setPasswords( items );
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [ canLoad ] );

	return { passwords, setPasswords };
}

function getBasicAuthorizationHeader( username: string, password: string ) {
	const bytes = new TextEncoder().encode( `${ username }:${ password }` );
	return `Basic ${ window.btoa( String.fromCharCode( ...bytes ) ) }`;
}

function getUnavailableMessage( data?: ApplicationPasswordsData ) {
	if ( ! data?.isAvailable ) {
		return data?.isSupported === false
			? __(
					'Application passwords require HTTPS. Set up HTTPS for this site, then reload this page.'
				)
			: __(
					'Application passwords are turned off on this site, usually by a plugin or hosting setting.'
				);
	}
	if ( ! data.isAvailableForUser ) {
		return __( 'Application passwords are turned off for your account.' );
	}
	if ( ! data.canCreate ) {
		return __(
			'You do not have permission to create application passwords.'
		);
	}
	return null;
}

function getPasswordDetails( password: McpApplicationPassword ) {
	const created = dateI18n( __( 'F j, Y' ), password.created );
	if ( ! password.last_used ) {
		return sprintf(
			/* translators: %s: Date the application password was created. */
			__( 'Created %s · Never used' ),
			created
		);
	}
	return sprintf(
		/* translators: 1: Date the application password was created. 2: Date it was last used. */
		__( 'Created %1$s · Last used %2$s' ),
		created,
		dateI18n( __( 'F j, Y' ), password.last_used )
	);
}

function CopyableField( {
	label,
	value,
	description,
}: {
	label: string;
	value: string;
	description?: string;
} ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const ref = useCopyToClipboard( value, () => {
		setHasCopied( true );
		speak( __( 'Copied to clipboard.' ) );
	} );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}
		const timeout = setTimeout( () => setHasCopied( false ), 2000 );
		return () => clearTimeout( timeout );
	}, [ hasCopied ] );

	return (
		<InputControl
			className="connector-mcp__code"
			label={ label }
			description={ description }
			value={ value }
			readOnly
			suffix={
				<InputLayout.Slot padding="minimal">
					<Button
						ref={ ref }
						icon={ hasCopied ? check : copySmall }
						label={
							hasCopied
								? __( 'Copied!' )
								: sprintf(
										/* translators: %s: Field label, e.g. "Username". */
										__( 'Copy %s' ),
										label
									)
						}
						size="small"
					/>
				</InputLayout.Slot>
			}
		/>
	);
}

function NewPasswordCredentials( {
	username,
	password,
	onDone,
}: {
	username: string;
	password: string;
	onDone: () => void;
} ) {
	return (
		<Stack direction="column" gap="lg">
			<Notice.Root intent="success">
				<Notice.Description>
					{ __(
						'Application password created. Copy it now, it will not be shown again.'
					) }
				</Notice.Description>
			</Notice.Root>
			<CopyableField label={ __( 'Username' ) } value={ username } />
			<CopyableField
				label={ __( 'Application password' ) }
				value={ password }
			/>
			<CopyableField
				label={ __( 'Authorization header' ) }
				value={ getBasicAuthorizationHeader( username, password ) }
				description={ __(
					'Send this header with each request to the MCP endpoint.'
				) }
			/>
			<Stack>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ onDone }
				>
					{ __( 'Done' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

function AddPasswordForm( {
	onCreated,
	onCancel,
}: {
	onCreated: ( item: McpApplicationPassword, password: string ) => void;
	onCancel?: () => void;
} ) {
	const [ name, setName ] = useState( '' );
	const [ isCreating, setIsCreating ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const createPassword = async ( event: React.FormEvent ) => {
		event.preventDefault();
		if ( ! name.trim() || isCreating ) {
			return;
		}
		setError( null );
		setIsCreating( true );
		try {
			const { password, ...item } = await apiFetch<
				McpApplicationPassword & { password: string }
			>( {
				path: APPLICATION_PASSWORDS_PATH,
				method: 'POST',
				data: { name: name.trim(), app_id: MCP_APP_ID },
			} );
			onCreated( item, password );
		} catch ( requestError ) {
			setError(
				( requestError as { message?: string } )?.message ||
					__( 'The application password could not be created.' )
			);
			setIsCreating( false );
		}
	};

	return (
		<form onSubmit={ createPassword }>
			<Stack direction="column" gap="lg">
				<InputControl
					label={ __( 'Name' ) }
					description={ __(
						'Name it after the MCP client that will use it.'
					) }
					placeholder={ __( 'e.g. Claude Code on my laptop' ) }
					value={ name }
					onValueChange={ ( value ) => {
						setError( null );
						setName( value );
					} }
					disabled={ isCreating }
				/>
				{ error && (
					<Text
						variant="body-sm"
						role="alert"
						className="connector-settings__error"
					>
						{ error }
					</Text>
				) }
				<Stack gap="sm">
					<Button
						__next40pxDefaultSize
						type="submit"
						variant="primary"
						disabled={ ! name.trim() || isCreating }
						accessibleWhenDisabled
						isBusy={ isCreating }
					>
						{ __( 'Create application password' ) }
					</Button>
					{ onCancel && (
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onCancel }
						>
							{ __( 'Cancel' ) }
						</Button>
					) }
				</Stack>
			</Stack>
		</form>
	);
}

function PasswordList( {
	passwords,
	onRevoke,
}: {
	passwords: McpApplicationPassword[];
	onRevoke: ( item: McpApplicationPassword ) => void;
} ) {
	return (
		<ul className="connector-mcp__passwords">
			{ passwords.map( ( item ) => (
				<li key={ item.uuid } className="connector-mcp__password">
					<Stack direction="column" gap="xs">
						<Text
							variant="body-md"
							className="connector-mcp__password-name"
						>
							{ item.name }
						</Text>
						<Text
							variant="body-sm"
							className="connector-mcp__password-details"
						>
							{ getPasswordDetails( item ) }
						</Text>
					</Stack>
					<Button
						size="compact"
						variant="tertiary"
						isDestructive
						onClick={ () => onRevoke( item ) }
						aria-label={ sprintf(
							/* translators: %s: Application password name. */
							__( 'Revoke "%s"' ),
							item.name
						) }
					>
						{ __( 'Revoke' ) }
					</Button>
				</li>
			) ) }
		</ul>
	);
}

function ApplicationPasswordsSection( {
	applicationPasswords,
	passwords,
	onPasswordsChange,
}: {
	applicationPasswords?: ApplicationPasswordsData;
	passwords?: McpApplicationPassword[];
	onPasswordsChange: ( passwords: McpApplicationPassword[] ) => void;
} ) {
	const [ isAdding, setIsAdding ] = useState( false );
	const [ newPassword, setNewPassword ] = useState< string | null >( null );
	const [ passwordToRevoke, setPasswordToRevoke ] =
		useState< McpApplicationPassword >();
	const [ isRevoking, setIsRevoking ] = useState( false );
	const [ revokeError, setRevokeError ] = useState< string | null >( null );

	const unavailableMessage = getUnavailableMessage( applicationPasswords );
	if ( ! applicationPasswords || unavailableMessage ) {
		return (
			<Notice.Root intent="warning">
				<Notice.Description>{ unavailableMessage }</Notice.Description>
			</Notice.Root>
		);
	}

	if ( ! passwords ) {
		return <Spinner />;
	}

	const { username, profileUrl } = applicationPasswords;

	const revokePassword = async () => {
		if ( ! passwordToRevoke ) {
			return;
		}
		setRevokeError( null );
		setIsRevoking( true );
		try {
			await apiFetch( {
				path: `${ APPLICATION_PASSWORDS_PATH }/${ passwordToRevoke.uuid }`,
				method: 'DELETE',
			} );
			onPasswordsChange(
				passwords.filter(
					( item ) => item.uuid !== passwordToRevoke.uuid
				)
			);
			speak( __( 'Application password revoked.' ) );
		} catch ( requestError ) {
			setRevokeError(
				( requestError as { message?: string } )?.message ||
					__( 'The application password could not be revoked.' )
			);
		} finally {
			setIsRevoking( false );
			setPasswordToRevoke( undefined );
		}
	};

	let addArea;
	if ( newPassword ) {
		addArea = (
			<NewPasswordCredentials
				username={ username }
				password={ newPassword }
				onDone={ () => setNewPassword( null ) }
			/>
		);
	} else if ( isAdding || ! passwords.length ) {
		addArea = (
			<AddPasswordForm
				onCreated={ ( item, password ) => {
					onPasswordsChange( [ item, ...passwords ] );
					setNewPassword( password );
					setIsAdding( false );
				} }
				onCancel={
					passwords.length ? () => setIsAdding( false ) : undefined
				}
			/>
		);
	} else {
		addArea = (
			<Stack>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => setIsAdding( true ) }
				>
					{ __( 'Add application password' ) }
				</Button>
			</Stack>
		);
	}

	return (
		<Stack direction="column" gap="lg">
			{ passwords.length > 0 && (
				<PasswordList
					passwords={ passwords }
					onRevoke={ setPasswordToRevoke }
				/>
			) }
			{ revokeError && (
				<Text
					variant="body-sm"
					role="alert"
					className="connector-settings__error"
				>
					{ revokeError }
				</Text>
			) }
			<Stack direction="column" gap="xs">
				{ passwords.length > 0 && (
					<Text variant="body-sm">
						{ __(
							'Only application passwords created here are listed.'
						) }
					</Text>
				) }
				<Text variant="body-sm">
					<Link href={ profileUrl }>
						{ __( 'Manage all application passwords' ) }
					</Link>
				</Text>
			</Stack>
			{ addArea }
			<ConfirmDialog
				isOpen={ !! passwordToRevoke }
				title={ sprintf(
					/* translators: %s: Application password name. */
					__( 'Revoke "%s"' ),
					passwordToRevoke?.name ?? ''
				) }
				__experimentalHideHeader={ false }
				onConfirm={ revokePassword }
				onCancel={ () => setPasswordToRevoke( undefined ) }
				confirmButtonText={ __( 'Revoke' ) }
				isBusy={ isRevoking }
				size="small"
			>
				{ __(
					'Are you sure you want to revoke this password? This action cannot be undone.'
				) }
			</ConfirmDialog>
		</Stack>
	);
}

/**
 * Guides connecting MCP clients to the site through the MCP Adapter.
 *
 * @param props                      - Component props.
 * @param props.endpoint             - Value returned by `useMcpEndpoint()`.
 * @param props.applicationPasswords - Application password availability for the current user.
 * @param props.passwords            - Application passwords created on this card, or `undefined` while loading.
 * @param props.onPasswordsChange    - Called with the updated application passwords.
 */
export function McpConnectorSettings( {
	endpoint,
	applicationPasswords,
	passwords,
	onPasswordsChange,
}: {
	endpoint?: string | null | false;
	applicationPasswords?: ApplicationPasswordsData;
	passwords?: McpApplicationPassword[];
	onPasswordsChange: ( passwords: McpApplicationPassword[] ) => void;
} ) {
	if ( endpoint === undefined ) {
		return <Spinner />;
	}

	const docsLink = (
		<Link
			href={ __(
				'https://github.com/WordPress/mcp-adapter/blob/trunk/docs/getting-started/site-owners.md'
			) }
			openInNewTab
		>
			{ __( 'Learn how to connect an MCP client' ) }
		</Link>
	);

	if ( ! endpoint ) {
		return (
			<Stack direction="column" gap="lg">
				<Notice.Root intent="warning">
					<Notice.Description>
						{ endpoint === null
							? __(
									'The MCP Adapter is active, but its default MCP server was not found.'
								)
							: __(
									'The MCP endpoint could not be loaded. Check that the REST API is reachable, then reload this page.'
								) }
					</Notice.Description>
				</Notice.Root>
				<Text variant="body-md">{ docsLink }</Text>
			</Stack>
		);
	}

	return (
		<Stack direction="column" gap="2xl">
			<CopyableField
				label={ __( 'MCP endpoint' ) }
				value={ endpoint }
				description={ __( 'Add this address to your MCP client.' ) }
			/>
			<Stack direction="column" gap="lg">
				<Stack direction="column" gap="xs">
					<Text variant="heading-md" render={ <h3 /> }>
						{ __( 'Application passwords' ) }
					</Text>
					<Text variant="body-md">
						{ __(
							'MCP clients sign in with an application password. Each one can use the REST API with your account’s permissions, not just MCP, so create one per client and revoke any you no longer use.'
						) }
					</Text>
				</Stack>
				<ApplicationPasswordsSection
					applicationPasswords={ applicationPasswords }
					passwords={ passwords }
					onPasswordsChange={ onPasswordsChange }
				/>
			</Stack>
			<Stack direction="column" gap="xs">
				<Text variant="body-sm">
					{ __(
						'If a client connects but finds no abilities, none are exposed over MCP yet. Plugins can provide them.'
					) }
				</Text>
				<Text variant="body-md">{ docsLink }</Text>
			</Stack>
		</Stack>
	);
}
