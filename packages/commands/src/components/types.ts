import type {
	Command,
	CommandCategory,
	CommandConfig,
	CommandLoader,
	CommandLoaderHook,
} from '../store/types';

export type OnResolved = (
	loaderName: string,
	commands: CommandConfig[]
) => void;

export interface CommandItemProps {
	command: CommandConfig;
	search: string;
	category?: CommandCategory;
	valuePrefix?: string;
}

export interface CommandMenuLoaderProps {
	name: string;
	search: string;
	hook: CommandLoaderHook;
	category?: CommandCategory;
	valuePrefix?: string;
}

export interface CommandListProps {
	search: string;
	commands: Command[];
	loaders: CommandLoader[];
	valuePrefix?: string;
}

export interface RecentLoaderRunnerProps {
	hook: CommandLoaderHook;
	name: string;
	filterNames: Set< string >;
	onResolved: OnResolved;
}

export interface CommandInputProps {
	search: string;
	setSearch: ( search: string ) => void;
}
