import type {
	Command,
	CommandConfig,
	CommandLoader,
	CommandLoaderHook,
	RegisterableCommandCategory,
} from '../store/types';

export type OnResolved = (
	loaderName: string,
	commands: CommandConfig[]
) => void;

export type RunCommand = ( command: Command, close: () => void ) => void;

// A type alias rather than an interface, so that it satisfies the index
// signature of the `Group` type that `Autocomplete.Root` accepts.
export type CommandGroup = {
	key: string;
	label: string;
	items: Command[];
};

export interface CommandItemProps {
	command: Command;
	search: string;
	onRun: RunCommand;
}

export interface LoaderCollectorOptions {
	hook: CommandLoaderHook;
	name: string;
	category?: RegisterableCommandCategory;
	search: string;
	onResolved: OnResolved;
}

export interface LoaderRunnerProps {
	loader: CommandLoader;
	search: string;
	onResolved: OnResolved;
}
