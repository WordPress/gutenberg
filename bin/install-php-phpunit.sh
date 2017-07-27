#!/bin/bash

# Uses phpbrew to install older php versions on modern(ish) distros.
# Installs a shim that selects the correct phpunit version to run
# if using an older version of php.

# we have to save and restore the original working directory, because
# phpbrew can mess up if we don't run it from the home directory
ORIG_DIR=`pwd`;
THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

mkdir -p $HOME/php-utils-bin

if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]] || [[ ${SWITCH_TO_PHP:0:3} == "5.3" ]]; then
  if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then
    PHPBREW_BUILT_CHECK=$HOME/.phpbrew/php/php-5.2.17/bin/php
  else
    PHPBREW_BUILT_CHECK=$HOME/.phpbrew/php/php-5.3.29/bin/php
  fi

  # install the phpunit shim to run the right phpunit version for these old php versions
	cp ${THIS_DIR}/phpunit-shim.sh $HOME/php-utils-bin/phpunit
	chmod +x $HOME/php-utils-bin/phpunit

  # install phpbrew
  curl -L -o $HOME/php-utils-bin/phpbrew https://github.com/phpbrew/phpbrew/raw/f6a422e1ba49293ee73bc4c317795c021bc57020/phpbrew
  chmod +x $HOME/php-utils-bin/phpbrew

  # symlink to phpunit3.6 in the ph5.2 installation
  PHP52_PATH=$HOME/.phpbrew/php/php-5.2.17
  ln -s ${PHP52_PATH}/lib/php/phpunit/phpunit.php $HOME/php-utils-bin/phpunit-3.6

  # install phpunit4.8
  curl -L -o $HOME/php-utils-bin/phpunit-4.8 https://phar.phpunit.de/phpunit-4.8.9.phar
  chmod +x $HOME/php-utils-bin/phpunit-4.8

	# got to check our php-utils-bin first, as we're overriding travis' phpunit shim
	export PATH=$HOME/php-utils-bin:$PATH

  # php and phpunit installs should be cached, only build if they're not there.
  if [ ! -f $PHPBREW_BUILT_CHECK ]; then
    
    # init with known --old to get 5.2 and 5.3
    $HOME/php-utils-bin/phpbrew init
    $HOME/php-utils-bin/phpbrew known --old

    # build PHP and install PHPUnit
    if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then

      # build PHP5.2
      tail -F $HOME/.phpbrew/build/php-5.2.17/build.log &
      TAIL_PID=$!
      $HOME/php-utils-bin/phpbrew install --patch ${THIS_DIR}/patches/node.patch --patch ${THIS_DIR}/patches/openssl.patch 5.2 +default +mysql +pdo \
      +gettext +phar +openssl -- --with-openssl-dir=/usr/include/openssl --enable-spl --with-mysql --with-mysqli=/usr/bin/mysql_config --with-pdo-mysql=/usr
      kill -TERM $TAIL_PID

      # install PHPUnit 3.6. The only install method available is from source, using git branches old
      # enough that they don't rely on any PHP5.3+ features. This clones each needed dependency
      # and then we add the paths to the include_path by setting up an extra .ini file
      cd ${PHP52_PATH}/lib/php

      # dependencies
      git clone --depth=1 --branch=1.1   git://github.com/sebastianbergmann/dbunit.git
      git clone --depth=1 --branch=1.1   git://github.com/sebastianbergmann/php-code-coverage.git
      git clone --depth=1 --branch=1.3.2 git://github.com/sebastianbergmann/php-file-iterator.git
      git clone --depth=1 --branch=1.1.1 git://github.com/sebastianbergmann/php-invoker.git
      git clone --depth=1 --branch=1.1.2 git://github.com/sebastianbergmann/php-text-template.git
      git clone --depth=1 --branch=1.0.3 git://github.com/sebastianbergmann/php-timer.git
      git clone --depth=1 --branch=1.1.4 git://github.com/sebastianbergmann/php-token-stream.git
      git clone --depth=1 --branch=1.1   git://github.com/sebastianbergmann/phpunit-mock-objects.git
      git clone --depth=1 --branch=1.1   git://github.com/sebastianbergmann/phpunit-selenium.git
      git clone --depth=1 --branch=1.0.0 git://github.com/sebastianbergmann/phpunit-story.git

      # and the version of phpunit that we expect to run with php 5.2
      git clone --depth=1 --branch=3.6   git://github.com/sebastianbergmann/phpunit.git

      # fix up the version number of phpunit
      sed -i 's/@package_version@/3.6-git/g' phpunit/PHPUnit/Runner/Version.php

      # now set up an ini file that adds all of the above to include_path for the PHP5.2 install
      mkdir -p $HOME/.phpbrew/php/php-5.2.17/var/db
      echo "include_path=.:${PHP52_PATH}/lib/php:${PHP52_PATH}/lib/php/dbunit:${PHP52_PATH}/lib/php/php-code-coverage:${PHP52_PATH}/lib/php/php-file-iterator:${PHP52_PATH}/lib/php/php-invoker:${PHP52_PATH}/lib/php/php-text-template:${PHP52_PATH}/lib/php/php-timer:${PHP52_PATH}/lib/php/php-token-stream:${PHP52_PATH}/lib/php/phpunit-mock-objects:${PHP52_PATH}/lib/php/phpunit-selenium:${PHP52_PATH}/lib/php/phpunit-story:${PHP52_PATH}/lib/php/phpunit" > ${PHP52_PATH}/var/db/path.ini

      # one more PHPUnit dependency that we need to install using pear under PHP5.2
      cd $HOME
      export PHPBREW_RC_ENABLE=1
      source $THIS_DIR/phpbrew.bashrc
      phpbrew use 5.2.17
      pear channel-discover pear.symfony-project.com
      pear install pear.symfony-project.com/YAML-1.0.2

    else
      # build PHP5.3
      tail -F $HOME/.phpbrew/build/php-5.3.29/build.log &
      TAIL_PID=$!
      $HOME/php-utils-bin/phpbrew install --patch ${THIS_DIR}/patches/node.patch --patch ${THIS_DIR}/patches/openssl.patch 5.3 +default +mysql +pdo \
      +gettext +phar +openssl -- --with-openssl-dir=/usr/include/openssl --enable-spl --with-mysql --with-mysqli=/usr/bin/mysql_config --with-pdo-mysql=/usr
      kill -TERM $TAIL_PID
    fi

    # clean up build directory
    rm -rf $HOME/.phpbrew/build/*
  fi


  # all needed php versions and phpunit versions are installed, either from the above
  # install script, or from travis cache, so switch to using them
  cd $HOME
  export PATH=$HOME/php-utils-bin:$PATH
  export PHPBREW_RC_ENABLE=1
  source $THIS_DIR/phpbrew.bashrc
  if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then
    # only switch if we're not already switched, or else phpbrew crashes
    if [[ -z "$PHPBREW_PHP" ]]; then
      phpbrew use 5.2.17
    fi
  else
    if [[ -z "$PHPBREW_PHP" ]]; then
      phpbrew use 5.3.29
    fi
  fi
elif [[ ${TRAVIS_PHP_VERSION:0:2} == "5." ]]; then
  # all other PHP 5.x versions
  mkdir -p $HOME/phpunit-bin
  wget -O $HOME/phpunit-bin/phpunit https://phar.phpunit.de/phpunit-4.8.phar
  chmod +x $HOME/phpunit-bin/phpunit
  export PATH=$HOME/phpunit-bin/:$PATH
else
  composer global require "phpunit/phpunit=5.7.*"
fi


cd $ORIG_DIR
