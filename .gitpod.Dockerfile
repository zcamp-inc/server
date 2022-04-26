FROM gitpod/workspace-postgres

RUN sudo apt-get update -q && sudo apt-get install -qy \
 redis-server