import { __ } from '@wordpress/i18n';
import type { PostWithPassword } from './types';

/*
 * Whether a post is password protected, without revealing the password.
 */
const PasswordView = ( { item }: { item: PostWithPassword } ) => {
	return item.password ? __( 'Protected' ) : __( 'None' );
};

export default PasswordView;
