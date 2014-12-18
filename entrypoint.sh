#! /bin/bash -e

# This is the entrypoint that must be used in conjunction /w docker-worker this
# expects a globally installed version of npm cache.
taskcluster-npm-cache --task-id $TASK_ID
