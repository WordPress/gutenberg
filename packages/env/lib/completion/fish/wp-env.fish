# Fish completion for wp-env.
#
# Reuses yargs' `--get-yargs-completions` flag, which returns the
# candidates for the current command line. yargs expects the tokens in
# the same shape its bash/zsh templates use: the program name
# followed by the command line tokens and a trailing empty token, so
# positional choices (containers, environments, runtimes) are offered.
# Fish filters the candidates by the current partial token automatically.
complete -c wp-env -f -a '(wp-env --get-yargs-completions wp-env (commandline -op) "")'
