import { lock } from './lock-unlock';
import { ShellPageActions } from './components/root/shell-page-actions';

export const privateApis = {};
lock( privateApis, {
	ShellPageActions,
} );
