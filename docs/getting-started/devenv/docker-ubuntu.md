# How to setup local WordPress environment on Ubuntu

This article covers setting up the local WordPress development environment using Docker on Ubuntu.

For Ubuntu 20.04.1, the standard docker binaries in the repository work as needed:

```
sudo apt install docker.io docker-compose
```

For earlier versions of Ubuntu, the docker binaries included in repositories did not support the features needed for the WordPress environment.

-   For Ubuntu prior to 20.04.1, follow these [directions from Docker to install](https://docs.docker.com/install/linux/docker-ce/ubuntu/). Additionally `docker-compose` is required, you may need to install separately, see [ Docker compose documentation](https://docs.docker.com/compose/install/).

## Troubleshooting

If you run into this error, when running `pnpm wp-env` from the Gutenberg directory:

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

After restarting the services, set the environment variable DOCKER_HOST and try starting using:

```
export DOCKER_HOST=tcp://127.0.0.1:2376
pnpm wp-env start
```

Your environment should be setup at: http://localhost:8888/
