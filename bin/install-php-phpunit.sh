#!/bin/bash

ORIG_DIR=`pwd`;
if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]] || [[ ${SWITCH_TO_PHP:0:3} == "5.3" ]]; then
  # install php runtime dependencies
  sudo apt-get install -y curl libxml2 libfreetype6 libpng12-0 libjpeg8 libgd3 libxpm4 \
  libltdl7 openssl gettext libgettextpo0 libmhash2 libmcrypt4 mysql-client

  if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then
    PHPBREW_BUILT_CHECK=$HOME/.phpbrew/php/php-5.2.17/bin/php
  else
    PHPBREW_BUILT_CHECK=$HOME/.phpbrew/php/php-5.3.29/bin/php
  fi

  # php and phpunit installs should be cached, only build if they're not there.
  if [ ! -f $PHPBREW_BUILT_CHECK ]; then
    
    # install build dependencies for building php (yes, for phpbrew, php is a dependency)
    sudo apt-get install -y php5-dev autoconf automake curl libcurl3-openssl-dev build-essential \
    libxslt1-dev re2c libxml2-dev php5-cli bison libbz2-dev libreadline-dev libfreetype6-dev \
    libpng12-dev libjpeg-dev libjpeg8-dev libgd-dev libltdl-dev libssl-dev libgettextpo-dev \
    libicu-dev libmhash-dev libmcrypt-dev libmysqlclient-dev libmysqld-dev git

    # install phpbrew for this user
    mkdir $HOME/php-utils-bin
    cd $HOME/php-utils-bin
    curl -L -O https://github.com/phpbrew/phpbrew/raw/f6a422e1ba49293ee73bc4c317795c021bc57020/phpbrew
    chmod +x phpbrew

    # init with known --old to get 5.2 and 5.3
    $HOME/php-utils-bin/phpbrew init
    $HOME/php-utils-bin/phpbrew known --old

    # build PHP and install PHPUnit
    if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then

      # build PHP5.2
      tail -F $HOME/.phpbrew/build/php-5.2.17/build.log &
      TAIL_PID=$!
      $HOME/php-utils-bin/phpbrew install --patch patches/node.patch --patch patches/openssl.patch 5.2 +default +mysql +pdo \
      +gettext +phar +openssl -- --with-openssl-dir=/usr/include/openssl --enable-spl --with-mysql --with-mysqli=/usr/bin/mysql_config --with-pdo-mysql=/usr
      kill -TERM $TAIL_PID

      # install PHPUnit 3.6. The only install method available is from source, using git branches old
      # enough that they don't rely on any PHP5.3+ features. This clones each needed dependency
      # and then we add the paths to the include_path by setting up an extra .ini file
      PHP52_PATH=$HOME/.phpbrew/php/php-5.2.17
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

      # symlink from $HOME/php-utils-bin to phpunit.php with the right version number. 'phpunit' will be aliased to this.
      ln -s ${PHP52_PATH}/lib/php/phpunit/phpunit.php $HOME/php-utils-bin/phpunit-3.6

      # one more PHPUnit dependency that we need to install using pear under PHP5.2
      cd $HOME
      export PHPBREW_RC_ENABLE=1
      source $HOME/.phpbrew/bashrc
      phpbrew use 5.2.17
      pear channel-discover pear.symfony-project.com
      pear install pear.symfony-project.com/YAML-1.0.2

    else
      # build PHP5.3
      tail -F $HOME/.phpbrew/build/php-5.3.29/build.log &
      TAIL_PID=$!
      $HOME/php-utils-bin/phpbrew install --patch patches/node.patch --patch patches/openssl.patch 5.3 +default +mysql +pdo \
      +gettext +phar +openssl -- --with-openssl-dir=/usr/include/openssl --enable-spl --with-mysql --with-mysqli=/usr/bin/mysql_config --with-pdo-mysql=/usr
      kill -TERM $TAIL_PID
      curl -L -o $HOME/php-utils-bin/phpunit-4.8 https://phar.phpunit.de/phpunit-4.8.9.phar
      chmod +x $HOME/php-utils-bin/phpunit-4.8
    fi
  fi

  # clean up build directory
  rm -rf $HOME/.phpbrew/build/*

  # all needed php versions and phpunit versions are installed, either from the above
  # install script, or from travis cache, so switch to using them
  cd $HOME
  export PATH=$HOME/php-utils-bin:$PATH
  export PHPBREW_RC_ENABLE=1
  source $HOME/.phpbrew/bashrc
  if [[ ${SWITCH_TO_PHP:0:3} == "5.2" ]]; then
    # only switch if we're not already switched, or else phpbrew crashes
    if [[ -z "$PHPBREW_PHP" ]]; then
      phpbrew use 5.2.17
    fi
    alias phpunit=$HOME/php-utils-bin/phpunit-3.6
  else
    if [[ -z "$PHPBREW_PHP" ]]; then
      phpbrew use 5.3.29
    fi
    alias phpunit=$HOME/php-utils-bin/phpunit-4.8
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

# install a script that calls the right phpunit version, depending on the php version running
cp phpunit-shim.sh $HOME/php-utils-bin/phpunit
chmod +x $HOME/php-utils-bin/phpunit

# got to check our php-utils-bin first, as we're overriding travis' phpunit shim
export PATH=$HOME/php-utils-bin:$PATH

cd $ORIG_DIR
