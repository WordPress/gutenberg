
# How to setup local WordPress environment on Ubuntu

This article covers setting up the local WordPress development environment using Docker on Ubuntu. The docker binaries included in the Ubuntu repositories (19.10 and earlier) do not support the features needed for the WordPress environment.

If you are using Ubuntu 19.04 or 18.04, you can follow these [directions from Docker to install](https://docs.docker.com/install/linux/docker-ce/ubuntu/).

If you are using Ubuntu 19.10, Docker does not have a repository setup for this version. However, the binaries are the same as previous, so you can download the packages from: https://download.docker.com/linux/ubuntu/dists/disco/pool/stable/amd64/

Packages required:

* `containerd.io_1.2.10-3_amd64.deb`
* `docker-ce-cli_19.03.3~3-0~ubuntu-disco_amd64.deb`
* `docker-ce_19.03.3~3-0~ubuntu-disco_amd64.deb`

Install using: `sudo dpkg -i *.deb`

Additionally, you need to install `docker-compose`, you can follow the [directions from Docker](https://docs.docker.com/compose/install/) or simply [download the latest binary](https://github.com/docker/compose/releases) from GitHub releases. 

After downloading the binary file `docker-compose-Linux-x86_64`, rename to just `docker-compose` and copy it to `/usr/local/bin` or another spot in your PATH.


## Troubleshooting

If you run into this error, when running `npm run env install` from the Gutenberg directory:

```
ERROR: Couldn't connect to Docker daemon at http+docker://localhost - is it running?

If it's at a non-standard location, specify the URL with the DOCKER_HOST environment variable.
```

First, make sure docker is running. You can check using `ps -ef | grep docker` which should show something like:

```
/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
```

If docker is not running, try to start the service using:

```
sudo systemctl start docker.service
```

If docker is running, then it is not listening how the WordPress environment is trying to communicate. Try adding the following service override file to include listening on tcp. See docker documentation, [How do I enable the remote API for dockerd](https://success.docker.com/article/how-do-i-enable-the-remote-api-for-dockerd)

```
# /etc/systemd/system/docker.service.d/override.conf
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2376
```

Restart the service from the command-line
```
sudo systemctl daemon-reload
sudo systemctl restart docker.service
```

After restarting the services, follow the instructions below to finish the installation. 

#### 1. Clean up

```
npm run clean:packages
rm -rf wordpress
```

Without this step, you'll see the error message like below:

```
It looks like WordPress is already installed, please delete the `wordpress` directory for a fresh install, or run `npm run env start` to start the existing environment.
```

As WordPress isn't installed yet, we cannot run `npm run env start`.

#### 2. Install

```
DOCKER_HOST=tcp://127.0.0.1:2376 npm run env install
```

If you run into the error message below, it means you used **http** rather than **tcp**. Please use **tcp**.

```
unable to resolve docker endpoint: Invalid bind address format: http://127.0.0.1:2376
```

When the installation finished successfully, you'll see the success message:

```
Plugin 'gutenberg' activated.
Success: Activated 1 of 1 plugins.

Welcome to...
,⁻⁻⁻·       .                 |
|  ،⁓’.   . |---  ,---. ,---. |---. ,---. ,---. ,---.
|   | |   | |     |---' |   | |   | |---' |     |   |
`---' `---' `---’ `---’ '   ` `---' `---’ `     `---|
                                                `---'

Run npm run dev to build the latest version of Gutenberg, then open http://localhost:8889 to get started!

Access the above install using the following credentials:
Default username: admin, password: password
```

#### 3. Start the server

Set the environment variable DOCKER_HOST and try starting using:

```
DOCKER_HOST=tcp://127.0.0.1:2376 npm run env start
```

Your environment should be setup at: http://localhost:8889/

**NOTE:** DOCKER_HOST isn't permanant. So, you need to add `DOCKER_HOST=tcp://127.0.0.1:2376` whenever you start the dev server.
