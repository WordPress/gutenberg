#!/bin/bash
# Brought from gugod's perlbrew.
# Authors:
#   - Yo-An Lin
#   - Márcio Almada

# PHPBrew defaults:
# PHPBREW_HOME: contains the phpbrew config (for users)
# PHPBREW_ROOT: contains installed php(s) and php source files.
# PHPBREW_SKIP_INIT: if you need to skip loading config from the init file. 
# PHPBREW_PHP:  the current php version.
# PHPBREW_PATH: the bin path of the current php.

[[ -z "$PHPBREW_HOME" ]] && export PHPBREW_HOME="$HOME/.phpbrew"
[[ -z "$PHPBREW_BIN" ]] && export PHPBREW_BIN="$PHPBREW_HOME/bin"

function __phpbrew_set_path()
{
    [[ -n $(alias php 2>/dev/null) ]] && unalias php 2> /dev/null

    if [[ -n $PHPBREW_ROOT ]] ; then
        export PATH_WITHOUT_PHPBREW=$(AR=(); for i in `echo $PATH|tr ':' ' '` ; do [[ `expr "$i" : "$PHPBREW_ROOT" 2>/dev/null` -eq 0 ]] && AR+=($i); done; echo "${AR[*]}"|tr ' ' ':';)
    else
        export PATH_WITHOUT_PHPBREW=$PATH
    fi

    if [[ -z "$PHPBREW_PATH" ]]
    then
        export PATH=$PHPBREW_BIN:$PATH_WITHOUT_PHPBREW
    else
        export PATH=$PHPBREW_PATH:$PHPBREW_BIN:$PATH_WITHOUT_PHPBREW
    fi
}

function __phpbrew_load_user_config()
{
    # load user-defined config
    if [[ -f $PHPBREW_HOME/init ]]; then
        . $PHPBREW_HOME/init
        __phpbrew_set_path
    fi
}

if [[ -z "$PHPBREW_SKIP_INIT" ]]; then
    __phpbrew_load_user_config
fi

[[ -z "$PHPBREW_ROOT" ]] && export PHPBREW_ROOT="$HOME/.phpbrew"
[[ -z "$PHPBREW_BIN" ]] && export PHPBREW_BIN="$PHPBREW_HOME/bin"
[[ -z "$PHPBREW_VERSION_REGEX" ]] && export PHPBREW_VERSION_REGEX="^([[:digit:]]+\.){2}[[:digit:]]+((alpha|beta|RC)[[:digit:]]+)?$"

[[ -e "$PHPBREW_ROOT" ]] || mkdir $PHPBREW_ROOT
[[ -e "$PHPBREW_HOME" ]] || mkdir $PHPBREW_HOME
[[ -e "$PHPBREW_BIN"  ]] || mkdir -p $PHPBREW_BIN

function __wget_as ()
{
    local url=$1
    local target=$2
    wget --no-check-certificate -c $url -O $target
}


# When setting lookup prefix, the alias name will be translated into the real
# path.
#
# Homebrew uses it's own prefix system with cellars, it's more dynamic then
# others.
#
# Detect package system automatically
function __phpbrew_set_lookup_prefix ()
{
    case $1 in
        debian|ubuntu|linux)
            # echo /usr/lib/x86_64-linux-gnu:/usr/lib/i386-linux-gnu
            echo /usr
        ;;
        macosx)
            echo /usr
        ;;
        macports)
            echo /opt/local
        ;;
        homebrew)
            # TODO: make this more dynamic. with brew --prefix call.
            echo /usr/local/opt:/usr/local
        ;;
        *)
            if [[ -e $1 ]] ; then
                echo $1
            else
                for dir in /opt/local /usr/local/Cellar /usr/local /usr ; do
                    if [[ -e $dir ]] ; then
                        echo $dir
                        return
                    fi
                done
            fi
        ;;
    esac
}


function phpbrew ()
{
    # Check bin/phpbrew if we are in PHPBrew source directory, 
    # This is only for development
    if [[ -e bin/phpbrew ]] ; then
        BIN='bin/phpbrew'
    else
        BIN=$(command -p which phpbrew 2> /dev/null || command which phpbrew)
    fi

    local exit_status
    local short_option
    if [[ `echo $1 | awk 'BEGIN{FS=""}{print $1}'` = '-' ]]
    then
        short_option=$1
        shift
    else
        short_option=""
    fi


    case $1 in
        use)
            if [[ -z "$2" ]] ; then
                if [[ -z "$PHPBREW_PHP" ]]
                then
                    echo "Currently using system php"
                else
                    echo "Currently using $PHPBREW_PHP"
                fi
            else
                if [[ ! -d "$PHPBREW_ROOT/php/$2" && $2 =~ $PHPBREW_VERSION_REGEX ]]
                then
                    _PHP_VERSION="php-$2"
                else
                    _PHP_VERSION=$2
                fi

                # checking php version exists?
                NEW_PHPBREW_PHP_PATH="$PHPBREW_ROOT/php/$_PHP_VERSION"
                if [ -d $NEW_PHPBREW_PHP_PATH ]; then
                    code=$(command $BIN env $_PHP_VERSION)
                    if [ -z "$code" ]
                    then
                        exit_status=1
                    else
                        eval "$code"
                        __phpbrew_set_path
                    fi
                else
                    echo "php version: $_PHP_VERSION not exists."
                fi
            fi
            ;;
        cd-src)
            local SOURCE_DIR=$PHPBREW_HOME/build/$PHPBREW_PHP
            if [[ -d $SOURCE_DIR ]] ; then
                builtin cd $SOURCE_DIR
            fi
            ;;
        switch)
            if [[ -z "$2" ]]
            then
                echo "Please specify the php version."
            else
                __phpbrew_reinit $2
            fi
            ;;
        lookup-prefix)
            if [[ -z "$2" ]] ; then
                if [[ -n $PHPBREW_LOOKUP_PREFIX ]] ; then
                    echo $PHPBREW_LOOKUP_PREFIX
                fi
            else
                export PHPBREW_LOOKUP_PREFIX=$(__phpbrew_set_lookup_prefix $2)
                echo $PHPBREW_LOOKUP_PREFIX
                __phpbrew_update_config
            fi
            ;;
        cd)
            case $2 in
                var)
                    local chdir=$PHPBREW_ROOT/php/$PHPBREW_PHP/var
                    ;;
                etc)
                    local chdir=$PHPBREW_ROOT/php/$PHPBREW_PHP/etc
                    ;;
                dist)
                    local chdir=$PHPBREW_ROOT/php/$PHPBREW_PHP
                    ;;
                build)
                    local chdir=$PHPBREW_ROOT/build/$PHPBREW_PHP
                    ;;
                *)
                    echo "$2 not found"
                    return 0
                ;;
            esac
            echo "Switching to $chdir, run 'cd -' to go back."
            builtin cd $chdir
            return 0
            ;;
        fpm)
            if ! [[ -z $3 ]]; then
              _PHP_VERSION=$3
            else
              _PHP_VERSION=${PHPBREW_PHP}
            fi

            mkdir -p ${PHPBREW_ROOT}/php/${_PHP_VERSION}/var/run
            PHPFPM_BIN=${PHPBREW_ROOT}/php/${_PHP_VERSION}/sbin/php-fpm
            PHPFPM_PIDFILE=${PHPBREW_ROOT}/php/${_PHP_VERSION}/var/run/php-fpm.pid

            function fpm_start()
            {
              echo "Starting php-fpm..."
              local regex="^php-5\.2.*"

              if [[ ${_PHP_VERSION} =~ ${regex} ]]; then
                ${PHPFPM_BIN} start
              else
                ${PHPFPM_BIN} --php-ini ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php.ini \
                  --fpm-config ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf \
                  --pid ${PHPFPM_PIDFILE} \
                  "$@"
              fi

              if [[ $? != "0" ]] ; then
                echo "php-fpm start failed."
              fi
            }
            function fpm_stop()
            {
              local regex="^php-5\.2.*"

              if [[ ${PHPBREW_PHP} =~ ${regex} ]]; then
                ${PHPFPM_BIN} stop
              elif [[ -e ${PHPFPM_PIDFILE} ]] ; then
                echo "Stopping php-fpm..."
                kill $(cat ${PHPFPM_PIDFILE})
                rm -f ${PHPFPM_PIDFILE}
              fi
            }
            case $2 in
                start)
                    fpm_start "${@:4}"
                    ;;
                stop)
                    fpm_stop
                    ;;
                setup)
                    command $PHPBREW_OVERRIDE_PHP $BIN $short_option "$@"
                    exit_status=$?
                    ;;
                restart)
                    fpm_stop
                    fpm_start "${@:4}"
                    ;;
                current)
                    if [[ -f $PHPFPM_PIDFILE ]] ; then
                        ps ux -p "$(cat $PHPFPM_PIDFILE)"
                    fi
                    ;;
                module)
                    $PHPFPM_BIN --php-ini ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php.ini \
                            --fpm-config ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf \
                            -m | less
                    ;;
                info)
                    $PHPFPM_BIN --php-ini ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php.ini \
                            --fpm-config ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf \
                            -i
                    ;;
                config)
                    if [[ -n $EDITOR ]] ; then
                        $EDITOR ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf
                    else
                        echo "Please set EDITOR environment variable for your favor."
                        nano ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf
                    fi
                    ;;
                which)
                    echo $PHPFPM_BIN
                    ;;
                help)
                    $PHPFPM_BIN --php-ini ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php.ini \
                            --fpm-config ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf --help
                    ;;
                test)
                    $PHPFPM_BIN --php-ini ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php.ini \
                            --fpm-config ${PHPBREW_ROOT}/php/${_PHP_VERSION}/etc/php-fpm.conf --test
                    ;;
                *)
                    echo "Usage: phpbrew fpm [start|stop|restart|module|test|config|setup|info|current|which|help]"
                    ;;
            esac
            ;;
        env)
            # we don't check php path here, you should check path before you
            # use env command to output the environment config.
            if [[ -n "$2" ]]; then
                export PHPBREW_PHP=$2
            fi
            echo "export PHPBREW_ROOT=$PHPBREW_ROOT";
            echo "export PHPBREW_HOME=$PHPBREW_HOME";
            if [[ -n $PHPBREW_LOOKUP_PREFIX ]] ; then
                echo "export PHPBREW_LOOKUP_PREFIX=$PHPBREW_LOOKUP_PREFIX";
            fi
            if [[ -n $PHPBREW_PHP ]] ; then
                echo "export PHPBREW_PHP=$PHPBREW_PHP";
                echo "export PHPBREW_PATH=$PHPBREW_ROOT/php/$PHPBREW_PHP/bin";
            fi
            ;;
        off)
            unset PHPBREW_PHP
            unset PHPBREW_PATH
            eval `$BIN env`
            __phpbrew_set_path
            echo "phpbrew is turned off."
            ;;
        switch-off)
            unset PHPBREW_PHP
            unset PHPBREW_PATH
            eval `$BIN env`
            __phpbrew_set_path
            __phpbrew_reinit
            echo "phpbrew is switched off."
            ;;
        rehash)
            echo "Rehashing..."
            . ~/.phpbrew/bashrc
            ;;
        purge)
            if [[ -z "$2" ]]
            then
                command $PHPBREW_OVERRIDE_PHP $BIN help
            else
                shift
                __phpbrew_purge "$@"
                exit_status=$?
            fi
            ;;
        *)
            command $PHPBREW_OVERRIDE_PHP $BIN $short_option "$@"
            exit_status=$?
            ;;
    esac
    hash -r
    return ${exit_status:-0}
}

function __phpbrew_update_config ()
{
    local VERSION
    if [[ ! -d "$PHPBREW_ROOT/php/$1" && $1 =~ $PHPBREW_VERSION_REGEX ]]
    then
        VERSION="php-$1"
    else
        VERSION=$1
    fi
    echo '# DO NOT EDIT THIS FILE' >| "$PHPBREW_HOME/init"
    command $BIN env $VERSION >> "$PHPBREW_HOME/init"
    . "$PHPBREW_HOME/init"
}

function __phpbrew_reinit () 
{
    if [[ -z "$1" ]] ; then
        local _PHP_VERSION=""
    else
        local _PHP_VERSION=$1
    fi
    if [[ ! -d "$PHPBREW_HOME" ]]
    then
        mkdir -p -p "$PHPBREW_HOME"
    fi
    __phpbrew_update_config $_PHP_VERSION
    __phpbrew_set_path
}

function __phpbrew_purge()
{
    local result=0

    for arg in "$@"
    do
        __phpbrew_purge_build "$arg" || result=$?
    done

    return $result
}

function __phpbrew_purge_build ()
{
    _PHP_VERSION=$1
    if [[ "$_PHP_VERSION" = "$PHPBREW_PHP" ]]
    then
        echo "php version: $_PHP_VERSION is already in use."
        return 1
    fi

    _PHP_BIN_PATH=$PHPBREW_ROOT/php/$_PHP_VERSION

    if [ ! -d $_PHP_BIN_PATH ]; then
        echo "php version: $_PHP_VERSION not installed."
        return 1
    fi

    _PHP_SOURCE_FILE=$PHPBREW_ROOT/build/$_PHP_VERSION.tar.bz2
    _PHP_BUILD_PATH=$PHPBREW_ROOT/build/$_PHP_VERSION

    rm -fr $_PHP_SOURCE_FILE $_PHP_BUILD_PATH $_PHP_BIN_PATH

    echo "php version: $_PHP_VERSION is removed and purged."

    return 0
}

function phpbrew_current_php_version() {
  if type "php" > /dev/null; then
    local version=$(php -v | grep -E "PHP [57]" | sed 's/.*PHP \([^-]*\).*/\1/' | cut -c 1-6)
    if [[ -z "$PHPBREW_PHP" ]]; then
      echo "php:$version-system"
    else
      echo "php:$version-phpbrew"
    fi
  else
     echo "php:not-installed"
  fi
}

if [[ -n "$PHPBREW_SET_PROMPT" && "$PHPBREW_SET_PROMPT" == "1" ]]; then
    export PS1="\w > \u@\h [\$(phpbrew_current_php_version)]\n\\$ "
fi


# the _phpbrewrc_load will be called after *every simple command* executed in bash,
# this will make the start up process slower if you have many commands to be run in your .bashrc or .zshrc
# so this function simply compares the directory and return if nothing neccessary to do.
# 
# here is the description of trap from bash manual page:
#
#   If one of the signals is DEBUG, the list of COMMANDS is executed after
#   every simple command.
#
function _phpbrewrc_load ()
{
    # check if working dir has changed
    if [[ "$PWD" == "$PHPBREW_LAST_DIR" ]]; then
        return
    fi
    local curr_dir="$PWD"
    local prev_dir="$OLDPWD"
    local curr_fs=0
    local prev_fs=0

    while [[ -n "$curr_dir" && -d "$curr_dir" ]] ; do
        prev_fs=$curr_fs
        curr_fs=$(stat -c %d . 2>/dev/null)  # GNU version
        if [ $? -ne 0 ]; then
            curr_fs=$(stat -f %d . 2>/dev/null)  # BSD version
        fi

        # check if top level directory or filesystem boundary is reached
        if [[ "$curr_dir" == "/" ]] || [ -z "$PHPBREW_RC_DISCOVERY_ACROSS_FILESYSTEM" -a $prev_fs -ne 0 -a $curr_fs -ne $prev_fs ]; then
            # check if there's a previously loaded .phpbrewrc
            if [[ ! -z "$PHPBREW_LAST_RC_DIR" ]]; then
                unset PHPBREW_LAST_RC_DIR
                __phpbrew_load_user_config
            fi
            break
        fi

        # check if .phpbrewrc present
        if [[ -r "$curr_dir/.phpbrewrc" ]]; then
            # check if it's not the same .phpbrewrc which was previously loaded
            if [[ "$curr_dir" != "$PHPBREW_LAST_RC_DIR" ]]; then
                __phpbrew_load_user_config
                PHPBREW_LAST_RC_DIR="$curr_dir"
                source "$curr_dir/.phpbrewrc"
            fi
            break
        fi
        curr_dir=$(dirname "$curr_dir")
    done
    PHPBREW_LAST_DIR="$PWD"
}

if [[ (-n "$BASH_VERSION" || -n "$ZSH_VERSION") && -n "$PHPBREW_RC_ENABLE" ]]; then
    trap "_phpbrewrc_load" DEBUG
fi
